# -*- encoding: utf-8 -*-
#   Copyright 2016 SDI Juan Carlos Montoya <jcmontoya@sdi.es>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "POS FIX Compute ALL",
    "version": "8.0.0.1",
    "author": "Juan Carlos Montoya",
    "website": "http://sdi.es",
    "license": "AGPL-3",
    "category": "POS",
    'summary': """
        Fix para calculo correcto de los impuestos con redondeo global en POS
    """,
    "depends": [
        'point_of_sale',
    ],
    "data": [
        'views/templates.xml'
    ],
    "installable": True,
}
