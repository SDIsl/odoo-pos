# -*- coding: utf-8 -*-
# © 2016 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
#        SDI Soluciones Informaticas - Juan Carlos Montoya <jcmontoya@sdi.es>
#        SDI Soluciones Informaticas - Javier Garcia Panach <jgarcia@sdi.es>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    "name": "POS Return Voucher",
    "version": "8.0.0.1.0",
    "author": """
                FactorLibre,
                SDI Soluciones Informaticas"
                Odoo Community Association (OCA)""",
    "website": "http://www.factorlibre.com",
    "license": "AGPL-3",
    "category": "Point Of Sale",
    "depends": [
        'point_of_sale',
        'pos_sub_menu_widget',
        'pos_simplified_invoice',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/data.xml',
        'views/pos_return_voucher.xml',
        'views/pos_voucher_view.xml',
        'views/account_journal_view.xml',
        'views/point_of_sale_view.xml'
    ],
    "qweb": [
        'static/src/xml/pos_return_voucher.xml',
    ],
    "installable": True,
}
