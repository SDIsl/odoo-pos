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

from openerp import models, api, fields, _, exceptions


class PosOrder(models.Model):
    _inherit = 'pos.order'

    is_return = fields.Boolean('Is return', default=False)

    @api.model
    def create(self, vals):
        res = super(PosOrder, self).create(vals)
        if res.amount_total < 0:
            res.write({'is_return': True})
        return res

    @api.model
    def search_orders_to_return(self, query):
        condition = [
            ('is_return', '=', False),
            ('state', 'in', ['paid', 'done', 'invoiced']),
            ('statement_ids', '!=', False),
            '|', '|',
            ('name', 'ilike', query),
            ('partner_id', 'ilike', query),
            ('pos_reference', 'ilike', query)
        ]
        _fields = ['name', 'pos_reference', 'date_order', 'partner_id',
                   'amount_total']
        # return self.search_read(condition, fields)
        res = self.search_read(condition, _fields)

        for record in res:
            obj_datetime = fields.Datetime.from_string(record['date_order'])
            formated_date_order = obj_datetime.strftime("%d/%m/%Y")
            record['date_order'] = formated_date_order
        return res

    @api.one
    def load_order_to_return(self):
        condition = [('order_id', '=', self.id), ('returned', '=', False)]
        fields = ['product_id', 'price_unit', 'qty', 'discount']
        orderlines = self.lines.search_read(condition, fields)

        # ########init routine for update qty available to return######

        for line in orderlines:
            obj_line = self.env['pos.order.line'].browse([line['id']])
            line['qty'] -= obj_line.total_returned
        # ########end routine for update qty available to return######
        res = {
            'id': self.id,
            'ref': self.pos_reference,
            'name': self.name,
            'partner_id': self.partner_id and self.partner_id.id or False,
            'orderlines': orderlines
        }
        #import pdb; pdb.set_trace()
        return res

    @api.one
    def load_return_order(self):
        return_order_id = self.refund()['res_id']
        return_order = self.browse(return_order_id)
        condition = [('order_id', '=', return_order_id)]
        fields = ['product_id', 'price_unit', 'qty', 'discount']
        orderlines = self.lines.search_read(condition, fields)
        return {
            'id': return_order.id,
            'id': return_order.id,
            'name': return_order.pos_reference,
            'partner_id': return_order.partner_id and
                          return_order.partner_id.id or False,
            'orderlines': orderlines
        }
