import time
import os
import os.path
from os.path import basename
from zipfile import ZipFile, ZIP_DEFLATED

import mpd
import platform

from deezer_downloader.configuration import config
from deezer_downloader.spotify import get_songs_from_spotify_website
from deezer_downloader.deezer import (
    TYPE_TRACK, TYPE_ALBUM, TYPE_PLAYLIST,
    get_song_infos_from_deezer_website, download_song,
    parse_deezer_playlist, deezer_search, get_deezer_favorites,
    Deezer403Exception, Deezer404Exception, DeezerApiException,
    get_file_extension,
)
from deezer_downloader.threadpool_queue import ThreadpoolScheduler, report_progress

sched = ThreadpoolScheduler()


def check_download_dirs_exist():
    for directory in [
        config["download_dirs"]["songs"],
        config["download_dirs"]["zips"],
        config["download_dirs"]["albums"],
        config["download_dirs"]["playlists"],
        config["download_dirs"]["youtubedl"],
    ]:
        os.makedirs(directory, exist_ok=True)


check_download_dirs_exist()


def make_song_paths_relative_to_mpd_root(songs, prefix=""):
    config["mpd"]["music_dir_root"] = os.path.join(config["mpd"]["music_dir_root"], '')
    return [prefix + song[len(config["mpd"]["music_dir_root"]):] for song in songs]


def update_mpd_db(songs, add_to_playlist):
    if not config["mpd"].getboolean("use_mpd"):
        return
    print("Updating mpd database")
    timeout_counter = 0
    mpd_client = mpd.MPDClient(use_unicode=True)
    try:
        mpd_client.connect(config["mpd"]["host"], config["mpd"].getint("port"))
    except ConnectionRefusedError as e:
        print(f"ERROR connecting to MPD: {e}")
        return
    mpd_client.update()
    if add_to_playlist:
        songs = [songs] if not isinstance(songs, list) else songs
        songs = make_song_paths_relative_to_mpd_root(songs)
        while len(mpd_client.search("file", songs[0])) == 0:
            if timeout_counter == 10:
                return
            timeout_counter += 1
            time.sleep(2)
        for song in songs:
            try:
                mpd_client.add(song)
            except mpd.base.CommandError as e:
                print(f"ERROR adding '{song}' to playlist: {e}")


def clean_filename(path):
    path = path.replace("\t", " ")
    specials = ['/', ':', '"', '?'] if not any(platform.win32_ver()) else ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
    return ''.join(c for c in path if c not in specials)


def download_song_and_get_absolute_filename(search_type, song, playlist_name=None):
    file_extension = get_file_extension()
    if search_type == TYPE_ALBUM:
        song_filename = "{:02d} - {} {}.{}".format(
            int(song['TRACK_NUMBER']), song['ART_NAME'], song['SNG_TITLE'], file_extension)
    else:
        song_filename = "{} - {}.{}".format(song['ART_NAME'], song['SNG_TITLE'], file_extension)
    song_filename = clean_filename(song_filename)

    if search_type == TYPE_TRACK:
        absolute_filename = os.path.join(config["download_dirs"]["songs"], song_filename)
    elif search_type == TYPE_ALBUM:
        album_name = clean_filename("{} - {}".format(
            song.get('ALB_ART_NAME', song.get('ART_NAME', '')), song['ALB_TITLE']))
        album_dir = os.path.join(config["download_dirs"]["albums"], album_name)
        os.makedirs(album_dir, exist_ok=True)
        absolute_filename = os.path.join(album_dir, song_filename)
    elif search_type == TYPE_PLAYLIST:
        assert isinstance(playlist_name, str)
        playlist_dir = os.path.join(config["download_dirs"]["playlists"], clean_filename(playlist_name))
        os.makedirs(playlist_dir, exist_ok=True)
        absolute_filename = os.path.join(playlist_dir, song_filename)

    if os.path.exists(absolute_filename):
        print(f"Skipping '{absolute_filename}' (already exists)")
    else:
        print(f"Downloading '{song_filename}'")
        download_song(song, absolute_filename)
    return absolute_filename


def create_zip_file(songs_absolute_location):
    parent_dir = basename(os.path.dirname(songs_absolute_location[0]))
    location_zip_file = os.path.join(config["download_dirs"]["zips"], f"{parent_dir}.zip")
    with ZipFile(location_zip_file, 'w', compression=ZIP_DEFLATED) as zf:
        for song_location in songs_absolute_location:
            try:
                zf.write(song_location, arcname=os.path.join(parent_dir, basename(song_location)))
            except FileNotFoundError:
                print(f"Could not find file '{song_location}'")
    return location_zip_file


def create_m3u8_file(songs_absolute_location):
    playlist_directory, _ = os.path.split(songs_absolute_location[0])
    m3u8_filename = "00 {}.m3u8".format(os.path.basename(playlist_directory))
    m3u8_file_abs = os.path.join(playlist_directory, m3u8_filename)
    with open(m3u8_file_abs, "w", encoding="utf-8") as f:
        for song in songs_absolute_location:
            if os.path.exists(song):
                f.write(basename(song) + "\n")
    songs_absolute_location.append(m3u8_file_abs)
    return songs_absolute_location


@sched.register_command()
def download_deezer_song_and_queue(track_id, add_to_playlist):
    song = get_song_infos_from_deezer_website(TYPE_TRACK, track_id)
    try:
        absolute_filename = download_song_and_get_absolute_filename(TYPE_TRACK, song)
        update_mpd_db(absolute_filename, add_to_playlist)
        return make_song_paths_relative_to_mpd_root([absolute_filename])
    except DeezerApiException:
        pass


@sched.register_command()
def download_deezer_album_and_queue_and_zip(album_id, add_to_playlist, create_zip):
    songs = get_song_infos_from_deezer_website(TYPE_ALBUM, album_id)
    songs_absolute_location = []
    for i, song in enumerate(songs):
        report_progress(i, len(songs))
        try:
            songs_absolute_location.append(download_song_and_get_absolute_filename(TYPE_ALBUM, song))
        except Exception as e:
            print(f"Warning: {e}")
    update_mpd_db(songs_absolute_location, add_to_playlist)
    if create_zip:
        return [create_zip_file(songs_absolute_location)]
    return make_song_paths_relative_to_mpd_root(songs_absolute_location)


@sched.register_command()
def download_deezer_playlist_and_queue_and_zip(playlist_id, add_to_playlist, create_zip):
    playlist_name, songs = parse_deezer_playlist(playlist_id)
    songs_absolute_location = []
    for i, song in enumerate(songs):
        report_progress(i, len(songs))
        try:
            songs_absolute_location.append(
                download_song_and_get_absolute_filename(TYPE_PLAYLIST, song, playlist_name))
        except Exception as e:
            print(f"Warning: {e}")
    update_mpd_db(songs_absolute_location, add_to_playlist)
    songs_with_m3u8 = create_m3u8_file(songs_absolute_location)
    if create_zip:
        return [create_zip_file(songs_with_m3u8)]
    return make_song_paths_relative_to_mpd_root(songs_absolute_location)


@sched.register_command()
def download_spotify_playlist_and_queue_and_zip(playlist_name, playlist_id, add_to_playlist, create_zip):
    songs = get_songs_from_spotify_website(playlist_id, config["proxy"]["server"])
    songs_absolute_location = []
    for i, song_of_playlist in enumerate(songs):
        report_progress(i, len(songs))
        try:
            track_id = deezer_search(song_of_playlist, TYPE_TRACK)[0]['id']
            song = get_song_infos_from_deezer_website(TYPE_TRACK, track_id)
            songs_absolute_location.append(
                download_song_and_get_absolute_filename(TYPE_PLAYLIST, song, playlist_name))
        except Exception as e:
            print(f"Warning: Could not download Spotify song ({song_of_playlist}): {e}")
    update_mpd_db(songs_absolute_location, add_to_playlist)
    songs_with_m3u8 = create_m3u8_file(songs_absolute_location)
    if create_zip:
        return [create_zip_file(songs_with_m3u8)]
    return make_song_paths_relative_to_mpd_root(songs_absolute_location)


@sched.register_command()
def download_deezer_favorites(user_id: str, add_to_playlist: bool, create_zip: bool):
    songs_absolute_location = []
    output_directory = f"favorites_{user_id}"
    for i, fav_song in enumerate(get_deezer_favorites(user_id)):
        report_progress(i, len([]))
        try:
            song = get_song_infos_from_deezer_website(TYPE_TRACK, fav_song)
            songs_absolute_location.append(
                download_song_and_get_absolute_filename(TYPE_PLAYLIST, song, output_directory))
        except (IndexError, Deezer403Exception, Deezer404Exception) as e:
            print(f"Could not find song ({fav_song}): {e}")
    update_mpd_db(songs_absolute_location, add_to_playlist)
    songs_with_m3u8 = create_m3u8_file(songs_absolute_location)
    if create_zip:
        return [create_zip_file(songs_with_m3u8)]
    return make_song_paths_relative_to_mpd_root(songs_absolute_location)
