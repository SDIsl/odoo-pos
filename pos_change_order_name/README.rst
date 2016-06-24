.. image:: https://img.shields.io/badge/licence-AGPL--3-blue.svg
   :target: http://www.gnu.org/licenses/agpl-3.0-standalone.html
   :alt: License: AGPL-3

=====================
POS Change Order Name
=====================

Descripción del módulo:
=======================
* Adapta la secuencia del terminal punto de venta a la legislación Española (facturas simplificadas con numeración correlativa)
* Mantiene la funcionalidad offline del point_of_sale, en caso de pérdida de conexión se puede seguir haciendo ventas sin alterar la secuencia.
 * Cuando vuelve la conexión se pulsa al botón de sincronizar y se graban los pedidos en el backend.
 * Los pedidos hechos sin conexión se guardan en caché y se pueden recuperar aún cerrando el navegador o apagando el ordenador.
  * Hay que tener en cuenta que al sincronizar hay que utilizar el mismo navegador (no se puede desde la versión de incógnito).
  * Muy importante no borrar la caché, ya que perderíamos esos pedidos.

Instalación:
============
Para instalar este módulo necesitas:
* point_of_sale (Odoo addon)

Configuración:
==============
* No hace falta configuración alguna, por defecto carga la secuencia asociada al TPV principal.
* Asegurarse que el navegador no tiene marcada la opción de borrar la caché o los datos de navegación al cerrarse.

Problemas conocidos:
====================
* No se puede iniciar sesión con el mismo usuario en navegadores diferentes:
** En el caso de hacer dos pedidos a la vez desde los dos navegadores (con un segundo de diferencia) hace un salto de secuencia.
** También se producen saltos en la secuencia al sincronizar pedidos desde el botón tras modo offline si se pulsa a la vez desde los dos navegadores, incluso hay pedidos que no llegan a crearse en el backend.
** En modo offline, si se hacen ventas desde dos puestos, dos clientes se podrían llevar el mismo número de factura simplificada, aunque en el backend mantenga la secuencia cuando recupere la conexión. 
* No se puede iniciar sesión con el mismo usuario en dos puestos distintos:
** Por las mismas causas que hemos comentado en el caso de los dos navegadores.


Mejoras / Hoja de ruta:
=======================
* Limitar a una sola sesión por usuario (para evitar arrancar el TPV en dos navegadores/puestos diferentes)
 

Updates
=======

* May 2016 : First version

Bug Tracker
===========

Bugs are tracked on `GitHub Issues <https://github.com/OCA/web/issues>`_.
In case of trouble, please check there if your issue has already been reported.
If you spotted it first, help us smashing it by providing a detailed and welcomed feedback `here <https://github.com/OCA/web/issues/new?body=module:%20pos_default_empty_image%0Aversion:%200.1%0A%0A**Steps%20to%20reproduce**%0A-%20...%0A%0A**Current%20behavior**%0A%0A**Expected%20behavior**>`_.


Credits
=======

Contributors
------------

* Juan Carlos Montoya Chamba <https://github.com/jcarlosmontoya> `juancarlos.montoya.chamba@gmail.com`
* Javier García-Panach <https://github.com/JGarcia-Panach> `panaka7@gmail.com`


Maintainer
----------

.. image:: https://odoo-community.org/logo.png
   :alt: Odoo Community Association
   :target: https://odoo-community.org

This module is maintained by the OCA.

OCA, or the Odoo Community Association, is a nonprofit organization whose
mission is to support the collaborative development of Odoo features and
promote its widespread use.

To contribute to this module, please visit http://odoo-community.org.
