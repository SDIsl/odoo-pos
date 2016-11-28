/**
 * Created by jcmontoya on 02/11/2016.
 */

openerp.pos_fix_compute_all = function (instance) {
    module = instance.point_of_sale;
    round_di = instance.web.round_decimals;
    round_pr = instance.web.round_precision

    module.Orderline = module.Orderline.extend({
        compute_all: function (taxes, price_unit) {
            var self = this;
            var res = [];
            var curr_rounding = this.pos.currency.rounding;
            var rd_method = this.pos.company.tax_calculation_rounding_method;
            /*if (rd_method == "round_globally") {
                curr_rounding *= 0.00001;
            }*/
            var base = price_unit;
            _(taxes).each(function (tax) {
                if (tax.price_include) {
                    if (tax.type === "percent") {
                        var tmp = round_pr(
                            base - round_pr(base / (1 + tax.amount), curr_rounding),
                            curr_rounding
                        );
                        var data = {
                            amount: tmp,
                            price_include: true,
                            id: tax.id
                        };
                        res.push(data);
                    } else if (tax.type === "fixed") {
                        tmp = tax.amount * self.get_quantity();
                        data = {amount: tmp, price_include: true, id: tax.id};
                        res.push(data);
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }
                } else {
                    if (tax.type === "percent") {
                        tmp = round_pr(tax.amount * base, curr_rounding);
                        data = {amount: tmp, price_include: false, id: tax.id};
                        res.push(data);
                    } else if (tax.type === "fixed") {
                        tmp = tax.amount * self.get_quantity();
                        data = {amount: tmp, price_include: false, id: tax.id};
                        res.push(data);
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }

                    var base_amount = data.amount;
                    var child_amount = 0.0;
                    if (tax.child_depend) {
                        res.pop(); // do not use parent tax
                        child_tax = self.compute_all(tax.child_taxes, base_amount);
                        res.push(child_tax);
                        _(child_tax).each(function (child) {
                            child_amount += child.amount;
                        });
                    }
                    if (tax.include_base_amount) {
                        base += base_amount + child_amount;
                    }
                }
            });
            return res;
        },

        get_base_price: function () {
            base = this.get_unit_price() * this.get_quantity() * (1 - this.get_discount() / 100);
            return base;
        },
    });
}