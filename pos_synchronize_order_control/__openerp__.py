# -*- encoding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    This module copyright :
#        (c) 2016 SDI
#                 Juan Carlos Montoya <jcmontoya@sdi.es>
#                 Javier Garcia <jgarcia@sdi.es>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
{
    'name': "Pos Synchronize Order control",

    'summary': """
        * Bloqueo del botón sincronizar pedidos
        cuando el POS está en modo offline""",

    'description': """
        Este modulo evita que se envien varias veces los pedidos en espera
        cuando el POS esta offline (varios clicks boton sincronizar pedidos)
        de esta manera evitamos errores de concurrencia en el servidor
        y un salto en la secuencia del nombre de los pedidos.
    """,

    'author': "Juan Carlos Montoya Ch.",
    'website': "http://www.sdi.es",
    'category': 'POS',
    'version': '0.1',
    'depends': ['point_of_sale'],

    'data': [
        # 'security/ir.model.access.csv',
        'views/templates.xml',
    ],
}
