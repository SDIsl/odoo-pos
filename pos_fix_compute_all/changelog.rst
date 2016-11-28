02/11/2016 jcm (POS FIX Compute ALl)
-----------------

* v 1.0

04/11/2016 jcm
* Se sobrescribe los metodos de account tax para forzar que el backend
para el TPV siempre lo haga como si fuese por linea
* En el frontend al calcular el precio base le quitamos el redondeo
* En el Frontend tambien eliminamos el aumento en el factor de precision
esto quiere decir que el TPV siempre opera redondeo por linea
De esta manera las compras y las ventas quedan para trabajar en modo global
claro esta si este parametro esta definido en la configuracion de la contabilidad
De lo contrario todo funcionaria normal en todo por linea.
Este cambio requiere un odoo-restart