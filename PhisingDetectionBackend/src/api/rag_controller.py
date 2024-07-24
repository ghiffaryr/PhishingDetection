from flask import request
from flask_restx import Resource
from utils.config import Config
from utils.decorator import Handler, Form
from service.impl.rag_service_chroma_huggingface_impl import RAGServiceChromaHuggingFaceImpl
import os


class UploadController(Resource):
   def post(self):
        @Handler.error
        def processing_request(form, file):
            form = form.to_dict()
            if file:
                form['file'] = {'content_type': file.content_type,
                                'filename': file.filename,
                                'content': file.read()
                                }
            required_keys = [
                "file"
            ]
            default_optional_keys = {}
            form = Form.validator(form, required_keys, default_optional_keys)
            if form['file']['content_type'] != "application/pdf":
                res = {'title': 'Bad Request',
                       'status': '400',
                       'description': 'Please input pdf in the multipart/form-data body by passing "file" as key and pdf as value.'
                    }
                return res

            save_path = f"{os.getcwd()}/{Config.get().data.path}"
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            file = form['file']['content']
            file_name = form['file']['filename']
            file_path = os.path.join(save_path, file_name)
            with open(file_path, 'wb') as f:
                f.write(file)

            res = {
            'title': 'File Uploaded',
            'status': '200',
            'description': 'File successfully uploaded.',
            'result': {'file_name': file_name,
                       'file_path': file_path}
            }
            return res
        form = request.form
        file = request.files.get('file')
        res = processing_request(form, file)
        return res

class UpdateChromaDatabaseController(Resource):
   def post(self):
        @Handler.error
        def processing_request(form):
            required_keys = [
                "file_path"
            ]
            default_optional_keys = {}
            form = Form.validator(form, required_keys, default_optional_keys)
            RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
            RAGServiceChromaHuggingFace.add(file_path=form['file_path'])

            res = {
            'title': 'Chroma DB Updated',
            'status': '200',
            'description': 'File successfully vectorized to Chroma DB.'
            }
            return res
        data = request.get_json(silent=True)
        res = processing_request(data)
        return res

class BatchUpdateChromaDatabaseController(Resource):
   def post(self):
        @Handler.error
        def processing_request():
            RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
            RAGServiceChromaHuggingFace.add_batch()
            
            res = {
            'title': 'Chroma DB Updated',
            'status': '200',
            'description': f'All data in {Config.get().data.path} successfully vectorized to Chroma DB.'
            }
            return res
        res = processing_request()
        return res

class GenerateContextFromChromaDatabaseController(Resource):
   def post(self):
        @Handler.error
        def processing_request(form):
            required_keys = [
                "query_text"
            ]
            default_optional_keys = {
                "k": 5,
                "separator": "\n\n---\n\n"
            }
            form = Form.validator(form, required_keys, default_optional_keys)
            RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
            generated_context = RAGServiceChromaHuggingFace.generate_context(query_text=form['query_text'],
                                                         k=form['k'],
                                                         separator=form['separator'])
            res = {
            'title': 'Context Generated',
            'status': '200',
            'description': f'Context generated with k={form["k"]} and separator={form["separator"]}.',
            'result': {
                "generated_context": generated_context
                }
            }
            return res
        data = request.get_json(silent=True)
        res = processing_request(data)
        return res