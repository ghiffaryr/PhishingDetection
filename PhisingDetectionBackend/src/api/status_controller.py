from flask_restx import Resource
from utils.decorator import Handler, Form
from utils.gpu_check import check_gpu

class StatusController(Resource):
    @Handler.error
    def get(self):
        res = {
            'title': 'Status Check',
            'status': '200',
            'description': 'Service is running.'
        }
        return res

class GPUCheckController(Resource):
    @Handler.error
    def get(self):
        gpu_info = check_gpu()
        res = {
            'title': 'GPU Check',
            'status': '200',
            'description': 'GPU check successful.',
            'result': gpu_info
        }
        return res