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

from openerp import models, api, fields


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    @api.multi
    @api.depends('return_line_qty_ids')
    def _get_total(self):
        for record in self:
            record.total_returned = sum(
                x.qty_returned for x in record.return_line_qty_ids)

    returned = fields.Boolean('Is returned completely?', default=False)
    # TODO: change name to return_qty_line_ids
    return_line_qty_ids = fields.One2many('pos.order.line.return.quantity.ids',
                                          'line_id')
    total_returned = fields.Float(
        'Total qty returned',
        compute="_get_total",
        digits=(8, 3)
    )

    # Method write pos.order is_return property when all lines are returned
    @api.multi
    def check_order_returned(self):
        returned_all = True
        for order_line in self:
            order = order_line.order_id
            for line in order.lines:
                if not line.returned:
                    returned_all = False
            if returned_all:
                order.write({'is_return': True})
                returned_all = True


class PosOrderLineReturnIds(models.Model):
    _name = 'pos.order.line.return.quantity.ids'
    _description = 'Return pos order line ids'

    line_id = fields.Many2one('pos.order.line')
    qty_returned = fields.Integer()

    @api.model
    def add_line_return_qty_ids(self, ids):
        res = []
        for record in ids:
            line = self.env['pos.order.line'].browse([record['id']])
            if not line.returned:
                id = self.create(
                    {'line_id': line.id, 'qty_returned': record['qty']})
                res.append(id.id)
            if int(line.total_returned) == int(line.qty):
                line.write({'returned': True})
            line.check_order_returned()

        if res:
            return res
