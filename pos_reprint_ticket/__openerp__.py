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
    "name": "POS Reprint Tickets",
    "version": "8.0.0.1.0",
    "author": "Juan Carlos Montoya",
    "website": "http://www.sdi.es",
    "license": "AGPL-3",
    "category": "Point Of Sale",
    "depends": [
        'point_of_sale',
        'pos_simplified_invoice',
    ],
    'data': [
        "views/pos_reprint_ticket.xml",
    ],
    "qweb": [
        'static/src/xml/pos_qweb.xml',
    ],
    "summary": "Reprint ticket and gift ticket in POS",
    "installable": True,
}
