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
from openerp.tools import float_is_zero
import time


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def _process_order(self, order):
        session = self.env['pos.session'].browse(order['pos_session_id'])

        if session.state == 'closing_control' or session.state == 'closed':
            session_id = self._get_valid_session(order)
            session = self.env['pos.session'].browse(order['pos_session_id'])
            order['pos_session_id'] = session_id

        order_id = self.create(self._order_fields(order))
        journal_ids = set()
        for payments in order['statement_ids']:
            self.add_payment(order_id.id, self._payment_fields(payments[2]))
            journal_ids.add(payments[2]['journal_id'])

        if session.sequence_number <= order['sequence_number']:
            session.write({'sequence_number': order['sequence_number'] + 1})
            session.refresh()

        if not float_is_zero(order['amount_return'],
                             self.env['decimal.precision'].precision_get(
                                     'Account')):

            cash_journal = session.cash_journal_id.id

            # new routine for update cash journal when return mode is defined
            if 'return_mode' in order.keys():
                if order['return_mode'] == 'voucher':
                    voucher_journal = self.env.ref(
                        'pos_return_voucher.account_voucher_journal')
                    if voucher_journal:
                        cash_journal = voucher_journal.id

            if not cash_journal:
                # Select for change one of the cash journals used in this pay
                cash_journal_ids = self.env['account.journal'].search([
                    ('type', '=', 'cash'),
                    ('id', 'in', list(journal_ids)),
                ], limit=1)
                if not cash_journal_ids:
                    # If none, select for change one of the cash journals of
                    # the POS. This is used for example when a customer pays
                    # by credit card an amount higher than total amount of
                    # the order and gets cash back
                    cash_journal_ids = [statement.journal_id.id for statement
                                        in session.statement_ids
                                        if statement.journal_id.type == 'cash']
                    if not cash_journal_ids:
                        raise exceptions.Warning(
                            _(
                                "No cash statement found for this session."
                                "Unable to record returned cash."))
                cash_journal = cash_journal_ids[0]
            self.add_payment(order_id.id, {
                'amount': -order['amount_return'],
                'payment_date': time.strftime('%Y-%m-%d %H:%M:%S'),
                'payment_name': _('return'),
                'journal': cash_journal,
            })
        return order_id.id
