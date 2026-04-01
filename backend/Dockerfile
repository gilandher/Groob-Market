# Usamos una imagen de Python oficial de una versión más nueva (>=3.13) requerida por Django 6
FROM python:3.13-slim

# Configuramos variables de entorno para que Python no escriba .pyc
# y para que el log se mande directo a la consola
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar o para la DB
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiamos primero el archivo de dependencias (para aprovechar caché de Docker)
COPY requirements.txt /app/

# Instalamos las librerías
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copiamos todo el contenido del backend al contenedor
COPY . /app/

# Exponemos el puerto del backend
EXPOSE 8000

# Ejecutamos gunicorn indicando el módulo wsgi de la carpeta 'config'
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
