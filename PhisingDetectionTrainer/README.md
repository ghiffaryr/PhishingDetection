# LLM Trainer for Binary Classification

## Configuration Steps
1. Install Python 3.10, preferably using Conda
2. Update pip package manager to the latest version by
`
pip install --upgrade pip
`
3. Install Pipenv for Python isolated environment (pip and virtualenv) by
`
pip uninstall virtualenv && pip install pipenv --user && sudo apt install pipenv
`
4. In current working directory, create and enter pipenv shell
`
pipenv shell
`
5. Install dependencies
`
pipenv install
`
6. Create environment variables ".env" by referencing to ".env.default"
7. Configure project in the main.py
8. Start training and inference
`
python main.py
`
9. Inference summary path can be seen on resources/config.yml