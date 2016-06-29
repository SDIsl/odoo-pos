# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2014 Company Name.
#    @author Juan Carlos Montoya
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


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def search_orders_to_reprint(self, query):
        condition = [
            ('state', 'in', ['paid', 'done', 'invoiced']),
            ('statement_ids', '!=', False),
            '|', '|', '|',
            ('name', 'ilike', query),
            ('partner_id', 'ilike', query),
            ('pos_reference', 'ilike', query),
            ('date_order', 'ilike', query)
        ]
        fields_ = ['name', 'pos_reference', 'date_order', 'partner_id',
                   'amount_total']
        res = self.search_read(condition, fields_, limit=20)
        print "search_orders_to_reprint ejecutandose ---------------------->"
        for x in res:
            old_date_order = fields.Datetime.from_string(x['date_order'])
            old_date_order = fields.Datetime.context_timestamp(self,
                                                               old_date_order)
            old_date_order = old_date_order.strftime('%d/%m/%Y %H:%M:%S')
            x['date_order'] = old_date_order

        return res

    @api.one
    def load_reprint_order(self):
        condition = [('order_id', '=', self.id)]
        fields_ = ['product_id', 'price_unit', 'qty', 'discount', 'serial_number_id']
        orderlines = self.lines.search_read(condition, fields_)
        payment_amounts = []
        for amt in self.statement_ids:
            if amt.amount > 0:
                payment_amounts.append([amt.amount, amt.journal_id.id])
                print amt.journal_id.type, " --- ", amt.journal_id.id

        obj_datetime = fields.Datetime.from_string(self.date_order)
        old_date_order = fields.Datetime.context_timestamp(self,
                                                           obj_datetime)
        old_date_order = old_date_order.strftime('%d/%m/%Y %H:%M:%S')

        res = {
            'id': self.id,
            'name': self.name,
            'ref': self.pos_reference,
            'partner_id': self.partner_id and self.partner_id.id or False,
            'orderlines': orderlines,
            'payments': payment_amounts,
            'date_order': old_date_order
        }
        return res
