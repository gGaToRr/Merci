import os
import sys
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
)

CONFIG_PATH = os.environ.get(
    'DEEZER_CONFIG',
    os.path.join(os.path.dirname(__file__), '..', 'deezer-downloader.ini')
)


def main():
    # 1. Charger la config EN PREMIER — avant tout import qui lit config
    from deezer_downloader.configuration import load_config
    load_config(os.path.abspath(CONFIG_PATH))

    # 2. Seulement maintenant on peut importer et créer l'app
    from deezer_downloader.web.app import create_app
    application = create_app()

    from waitress import serve
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    logging.getLogger(__name__).info(f'Listening on {host}:{port}')
    serve(application, host=host, port=port)


if __name__ == '__main__':
    main()
