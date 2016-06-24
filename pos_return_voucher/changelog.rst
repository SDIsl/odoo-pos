Tuesday 19/04/2016
----------------------
* Agregar varios cambios al modulo (para poder vender usando multiples vales)
* Validar cuando pedido esta vacio
* Validar al crear una devolucion que los paymentlines del pedido no sean mayores que cero
* Corregir creacion automatica de vales sin antes validar, cuando creamos una factura
* Reescritura method validate_order al generar los vales (si se usa o se crea uno nuevo)
* Reescritura metodo use_voucher backend
* Reescritura posticket pos, ahora puede pintar todos los vales usados en una compra
* Corregir formato importe linea pago con vale (importe con 2 decimales)

Wednesday 20/04/2016
-----------------------
* Agregar fecha de creacion para cada linea del historial del vale (cada gasto)
* Desactivar linea pago con voucher cuando vamos a devolver un pedido (crear voucher)
* Agregar validacion al presionar tecla enter, cuando vamos a devolver con vale (no creaba vale, hacia un pago normal)
* Limpiar codigo innecesario, refactorizar

Friday 22/04/2016
-----------------------
* Fix concurrency access when validate order pos
* Fix concurrency RPC callbacks server
* Add block parameter order frontend
* Fix concurrency when multiple key press o mouse click

Monday 25/04/2016
-------------------
* Fix concurrency when multiple key press o mouse click to create new voucher (avoid create several entries in server)
* Block validate order when order is locked

Monday 02/05/2016
-------------------
* Delete payment line voucher on cancel popup

Monday 16/05/2016
-------------------
* Agregar imagen boton crear voucher formato a 48px
* Eliminar rutina ocultar des ocultar botones pantalla pago (ahora son procesadas desde el propio boton en el modulo return_products)
* Extender objeto pedido Tpv para pasar vouchers al ticket
* Validacion en ticket cuando hay vouchers
* sol. Imprimir vale codigo barras cuando validamos con tecla enter o intro
* sol. Validacion saldo voucher cuando es menor o igual  a cero (salia como caducado con valores ejem 0,20)

Thursday 23/06/2016
-------------------
* Cambios en las cuentas del diario para los vales (438)