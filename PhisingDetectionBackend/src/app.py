from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from api import ROUTES
from __init__ import __version__
from utils.config import Config
import os
from loguru import logger
from utils.api_logger import APILogger
from service.impl.rag_service_chroma_huggingface_impl import RAGServiceChromaHuggingFaceImpl
from service.impl.model_service_impl import ModelServiceImpl

DEFAULT_PREFIX = "/api/v0"
try:
    PREFIX = Config.get()['server']['servlet']['context_path']
except Exception as e:
    logger.debug(f"Context path is not defined!")
    logger.info(f"Using default prefix...")
    PREFIX = DEFAULT_PREFIX

HOST = os.environ.get('HOST', '0.0.0.0')
PORT = os.environ.get('PORT', '8000')

app = Flask(__name__)
api = Api(app, 
          doc=PREFIX+'/docs', 
          version=__version__, 
          title='API', 
          description='A simple API')
cors = CORS(app, resources={r'/*': {'origins': '*'}})
api = api.namespace(PREFIX, description=f" * Active namespace at {PREFIX}")

# Initialize model
RAGServiceChromaHuggingFaceImpl.instance()

APILogger.instance().set_up()

for route, resource in ROUTES.items():
    api.add_resource(resource, route)
 
if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=True)