# Importante:

Este es el repo exclusivo para el código de la aplicación para Cáritas de Queretaro. Aqui solo esta el desarrollo de la aplicación, 
que usara NodeJS en conjunto con Express como nucleo y de momento HandlebarsJS para la interfaz. Planeamos usar VueJS y 
una API creada por nosotros para modularizar la app y que se vea mas dinámico. 

# Producción e Integración Continua (CI)
El branch MASTER solo es para PRODUCCIÓN, y sera automaticamente clonado por Azure para asegurar una integración continua.
El branch master es un reflejo de la versión corriendo en producción.

# Infraestructura y despliegue
Tenemos una instancia/contenedor de Azure App Service, que continuamente clona el contenido de la rama master y lo 
ejecuta en https://caritasqro.azurewebsites.net/ , de esta forma podemos automatizar el despliegue, ya que solo es pushear a master. 
No obstante, esta implementación provoca un efecto secundario muy interesante que se describiria posteriormente.

Esto nos da muchas ventajas, la principal de ellas es la escalabilidad, ya que no tenemos que preocuparnos por actualizaciones 
de seguridad, tampoco nos tenemos que preocupar por la infraestructura del servidor. Mas adelante se describe en detalle este aspecto.

En cuanto a la Base de Datos, estamos usando una instancia de Azure Postgree SQL cloud, que maneja copias de seguridad,
actualizaciones y escalamiento de forma automática, de acuerdo a las cargas de trabajo. Nosotros podemos conectarnos de forma remota
a la BD a traves de su HOST publico, aunque antes hay que dar de alta nuestras direcciones IP en el firewall. La aplicación 
puede conectarse de forma automática.

## Efectos secundarios de este despliegue: Incertidubre de los archivos de los usuarios.
Este despliegue trata siempre de que el contenido en producción (Azure) este apegado a la rama master. Por lo que se puede decir que 
esta se puede considerar como la versión de producción. Si algo esta en master, estará en producción ejecutandose. De lo contario, no 
se puede garantizar ni descartar su existencia. Esto causa un error que provoca que los archivos subidos por los usuarios (imágenes,
videos, etc) **no sean permanentes**. Por lo que a veces suelen desaparecer.

### Solución a este efecto
Por el momento estamos investigando usar Firebase o Azure BLOB storage, ya que aquí si podemos garantizar su persistencia. Como ventaja
adicional de este mecanismo, podemos usar la CDN de Microsoft, lo que le da mucha escalabilidad y disminuye considerablemente los
tiempos de carga, ya que los servidores de Azure BLOB storage estan optimizados para la transferencia de contenido multimedia.

## Detalles del despliegue
En realidad el lugar donde tenemos desplegada la aplicación es un **contenedor de linux basado en Docker**. Este empaqueta el *runtime* de NodeJS junto con las dependencias de la aplicación y los archivos de la aplicación. El empaquetado y las dependencias son 
administrados automaticamente.

#
