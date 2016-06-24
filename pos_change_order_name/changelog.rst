Monday 06/06/2016
-------------------
* Se sobrescribe push_order para retornar los ids del backend
* Rutina para cambiar el nombre de la secuencia cuando el POS esta offline.
  Se utiliza el último nombre capturado del backend.

Tuesday 07/06/2016
-------------------------
* Se realizan varios cambios para el tratamiento de la secuencia del pedido en la parte del cliente
* Fix Validación para el cambio secuencia POS offline
* Control validate_order para evitar problemas concurrencia backend cuando el usuario presiona
    tecla enter repetidamente o con múltiples clicks al validar el pedido (producía saltos de secuencia)

Tuesday 21/06/2016
-------------------------
* Refactorización módulo (limpieza, order, renombramiento de rutinas y propiedades)
* Ahora se carga la secuencia del POS para tener un mejor control a la hora de definir prefijo, padding, próximo número
* Ahora la secuencia del POS se mantiene aún cuando esta trabajando en modo offline
* Renombramiento de propiedades y agregar nuevos métodos de control
* Agregar un fichero Readme