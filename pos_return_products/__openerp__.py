# -*- coding: utf-8 -*-
##############################################################################
#
#   OpenERP, Open Source Management Solution
#   © 2016 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
#        SDI Soluciones Informaticas - Juan Carlos Montoya <jcmontoya@sdi.es>
#        SDI Soluciones Informaticas - Javier Garcia Panach <jgarcia@sdi.es>
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
    "name": "POS Return Products",
    "version": "8.0.0.1.0",
    "author": """
                FactorLibre,
                SDI Soluciones Informaticas,
                Odoo Community Association (OCA)""",
    "website": "http://www.factorlibre.com",
    "license": "AGPL-3",
    "category": "Point Of Sale",
    "depends": [
        'point_of_sale',
        'pos_sub_menu_widget'
    ],
    'data': [
        "views/pos_return_products.xml",
        "views/pos_order.xml",
    ],
    "qweb": [
        'static/src/xml/pos_return_products.xml',
    ],
    "installable": True,
}
