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

from openerp import models, fields, api, exceptions, _
from datetime import datetime
import openerp


class PosVoucher(models.Model):
    _name = 'pos.voucher'
    _description = 'POS Voucher'

    session_id = fields.Many2one('pos.session', 'Pos Session')
    state = fields.Selection(string="State", selection=[
        ('available', 'Available'),
        ('expired', 'Expired')
    ])
    name = fields.Char('Code', readonly=True, default=False)
    amount = fields.Float('Amount Available')
    due_date = fields.Date(
        'Due date',
        readonly=False)
    voucher_history_lines = fields.One2many(
        'pos.voucher.history_line',
        'voucher_id',
        'Voucher History',
        readonly=True)
    partner_id = fields.Many2one(
        'res.partner', domain=[('customer', '=', True)], string="Partner")

    _order = 'create_date desc'

    @api.constrains('amount')
    def _check_amount(self):
        if self.amount == int(0.00):
            self.state = 'expired'

    @api.constrains('due_date')
    # todo: ensure_one for record set, validate with datetime obj
    def _check_due_date(self):
        if self.session_id.config_id.vouchers_expire:
            if self.due_date < self.create_date:
                raise exceptions.Warning(
                    _("Due date must be greater than the creation date"))

    @staticmethod
    def get_ean13(voucher_id, barcode_voucher):
        aux = str(voucher_id)
        aux = aux.zfill(12 - len(barcode_voucher))
        return openerp.addons.product.product.sanitize_ean13(
            barcode_voucher + aux)

    @api.model
    def create_from_ui(self, values, order_reference, barcode_voucher,
                       partner_id):
        if 'amount' not in values:
            raise exceptions.Warning(_('The amount is required'))

        new_voucher = self.create(values)
        ean13 = self.get_ean13(new_voucher.id, barcode_voucher)
        new_voucher.write({'name': ean13,
                           'partner_id': partner_id or False,
                           'state': 'available'})

        # return due_date format d/m/y
        res = {}
        if new_voucher.due_date:
            obj_date = fields.Date.from_string(new_voucher.due_date)
            res.update({'due_date': obj_date.strftime("%d/%m/%Y")})

        res.update({
            'amount': new_voucher.amount,
            'partner_id': new_voucher.partner_id.id or False,
            'name': new_voucher.name,
        })

        # save new_voucher.voucher_history_lines here
        domain = [('pos_reference', '=', order_reference)]
        pos_order_id = self.env['pos.order'].search(domain)
        new_voucher.write(
            {'voucher_history_lines': [(0, 0, {'amount': res['amount'],
                                               'operation_type': 'input',
                                               'pos_order_id': pos_order_id.id,
                                               'voucher_id': new_voucher.id,
                                               'date': fields.Datetime.now()
                                               })]}
        )

        return res

    @api.model
    def search_vouchers(self, query='', partner_id=False):
        condition = []
        if query != '':
            condition += [
                '|',
                ('name', 'ilike', query),
                ('partner_id', 'ilike', query)
            ]
        else:
            condition += [
                ('due_date', '>=', datetime.today()),
                ('amount', '>', 0)
            ]
        # Remove filter per partner
        # if partner_id:
        #     condition.append(('partner_id', '=', partner_id))
        _fields = ['due_date', 'name', 'amount', 'partner_id']
        res = self.search_read(condition, _fields)
        for record in res:
            if record.get('due_date'):
                obj_datetime = fields.Datetime.from_string(record['due_date'])
                formatted_due_date = obj_datetime.strftime("%d/%m/%Y")
                record.update({'due_date': formatted_due_date})
            else:
                record.update({'due_date': ''})
        return res

    @api.model
    def use_voucher(self, datas):
        res = []
        for data in datas:

            voucher = self.browse(data.get('voucher_id'))
            new_amount = voucher.amount - data.get('amount')
            if new_amount < 0:
                new_amount = 0.00

            values = {'amount': new_amount}
            if 'new_due_date' in data.keys():
                values.update({
                    'due_date': data.get('new_due_date')
                })
            voucher.write(values)

            res.append(dict(
                name=voucher.name,
                amount=voucher.amount,
                due_date=voucher.due_date
            ))

            # pick up pos_order
            domain = [('pos_reference', '=', data.get('order_ref'))]
            pos_order_id = self.env['pos.order'].search(domain)

            # write history_lines
            voucher.write(
                {'voucher_history_lines': [
                    (0, 0, {'amount': data.get('amount'),
                            'operation_type': 'spend',
                            'pos_order_id': pos_order_id.id,
                            'voucher_id': voucher.id,
                            'date': fields.Datetime.now()
                            })]}
            )
        # now we send new total vouchers available
        return res


class PosVoucherHistoryLine(models.Model):
    _name = 'pos.voucher.history_line'
    _description = 'POS Voucher History Line'

    amount = fields.Float('Amount', readonly=True)
    operation_type = fields.Selection([
        ('input', 'Input'),
        ('spend', 'Spend')
    ], 'Operation Type', readonly=True)
    date = fields.Datetime(
        'Date',
        readonly=True,
        default=fields.Datetime.now())
    pos_order_id = fields.Many2one(
        'pos.order',
        'Related Order',
        readonly=True)
    voucher_id = fields.Many2one(
        'pos.voucher',
        'Related Voucher',
        readonly=True)
