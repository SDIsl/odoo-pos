# -*- coding: utf-8 -*-
##############################################################################
#
#   OpenERP, Open Source Management Solution
# © 2016 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
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

from openerp import models, api, fields, _, exceptions


class PosConfig(models.Model):
    _inherit = 'pos.config'

    vouchers_expire = fields.Boolean('Vouchers Expire?', default=True)
    voucher_validity_period = fields.Integer(
        'Voucher Validity Period',
        help="(In days) Period of validity of a voucher. If a voucher is "
             "recharged, its due date is updated.",
        default=30)
    # field prefix EAN13 (45) default
    barcode_voucher = fields.Char(string="Barcode for Voucher", default="45*")

    @api.constrains('voucher_validity_period')
    def _check_voucher_validity_period(self):
        if self.voucher_validity_period < 1:
            raise exceptions.Warning(
                _("Period must be greater than zero"))
