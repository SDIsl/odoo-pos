# -*- encoding: utf-8 -*-
#   Copyright 2016 SDI Juan Carlos Montoya <jcmontoya@sdi.es>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import models, fields, api
from openerp.osv import osv
import pdb


class account_tax(models.Model):
    _inherit = 'account.tax'

    @api.v7
    def compute_all(self, cr, uid, taxes, price_unit, quantity,
                    product=None, partner=None, force_excluded=False,
                    context=None):

        if not context:
            context = {}
        precision = self.pool.get('decimal.precision').precision_get(cr, uid,
                                                                     'Account')
        tax_compute_precision = precision
        res_model = None
        if 'params' in context.keys():
            act_id = context['params']['action']
            act_obj = self.pool.get('ir.actions.act_window')
            act_window = act_obj.browse(cr, uid, act_id, context=context)
            if act_window:
                res_model = act_window.res_model
        if taxes and taxes[0].company_id.tax_calculation_rounding_method == 'round_globally':
            if res_model and res_model not in ('pos.order', 'pos.order.line'):
                tax_compute_precision += 5
        totalin = totalex = round(price_unit * quantity, precision)
        tin = []
        tex = []
        for tax in taxes:
            if not tax.price_include or force_excluded:
                tex.append(tax)
            else:
                tin.append(tax)
        tin = self.compute_inv(cr, uid, tin, price_unit, quantity,
                               product=product, partner=partner,
                               precision=tax_compute_precision)
        for r in tin:
            totalex -= r.get('amount', 0.0)
        totlex_qty = 0.0
        try:
            totlex_qty = totalex / quantity
        except:
            pass
        tex = self._compute(cr, uid, tex, totlex_qty, quantity,
                            product=product, partner=partner,
                            precision=tax_compute_precision)
        for r in tex:
            totalin += r.get('amount', 0.0)
        return {
            'total': totalex,
            'total_included': totalin,
            'taxes': tin + tex
        }

    @api.v8
    def compute_all(self, price_unit, quantity, product=None, partner=None,
                    force_excluded=False):
        return account_tax.compute_all(
            self._model, self._cr, self._uid, self, price_unit, quantity,
            product=product, partner=partner, force_excluded=force_excluded,
            context=self._context)
