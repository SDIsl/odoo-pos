/* © 2015 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
 */

openerp.pos_return_voucher = function (instance, local) {
    module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    var round_pr = instance.web.round_precision;
    var round_di = instance.web.round_decimals;


    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_server_data: function () {
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function () {
                return self.fetch(
                    'pos.config',
                    [],
                    [['id', '=', self.pos_session.config_id[0]]]
                );

            }).then(function (configs) {
                self.config = configs[0];
                self.barcode_reader.add_barcode_patterns({
                    'voucher': self.config.barcode_voucher
                });
                return $.when()
            })
            return loaded;
        },
    });

    module.ActionBarWidget = module.ActionBarWidget.extend({
        set_button_hidden: function (name, hidden) {
            var b = this.buttons[name];
            if (b) {
                b.set_hidden(hidden);
            }
        },
    });


    module.ActionButtonWidget = module.ActionButtonWidget.extend({
        set_hidden: function (hide) {
            if (this.hide != hide) {
                this.hide = !!hide;
                this.renderElement();
            }
        },
        renderElement: function () {
            this._super();
            if (this.hide) {
                this.$el.addClass('hidden');
            } else {
                this.$el.removeClass('hidden');
            }
        },
    });

    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        initialize: function (attributes) {
            OrderSuper.prototype.initialize.call(this, attributes);
            this.used_voucher = attributes.used_voucher || false;
        },
        get_used_voucher: function () {
            return this.used_voucher;
        },
        set_used_voucher: function (voucher) {
            this.used_voucher = voucher;
        },
        get_picked_vouchers: function () {
            picked_voucher_ids = []
            paymentLines = this.attributes.paymentLines
            for (var i = 0, len = paymentLines.length; i < len; i++) {
                payment_line = paymentLines.models[i];
                if (payment_line.voucher) {
                    picked_voucher_ids.push(payment_line.voucher.id)
                }
            }
            ;
            return picked_voucher_ids
        },
        export_as_JSON: function () {
            console.log('jcm override export as jason jcm <<<<<<<<')
            var orderLines, paymentLines;
            orderLines = [];
            (this.get('orderLines')).each(_.bind(function (item) {
                return orderLines.push([0, 0, item.export_as_JSON()]);
            }, this));
            paymentLines = [];
            (this.get('paymentLines')).each(_.bind(function (item) {
                return paymentLines.push([0, 0, item.export_as_JSON()]);
            }, this));
            res = {
                name: this.getName(),
                amount_paid: this.getPaidTotal(),
                amount_total: this.getTotalTaxIncluded(),
                amount_tax: this.getTax(),
                amount_return: this.getChange(),
                lines: orderLines,
                statement_ids: paymentLines,
                pos_session_id: this.pos.pos_session.id,
                partner_id: this.get_client() ? this.get_client().id : false,
                user_id: this.pos.cashier ? this.pos.cashier.id : this.pos.user.id,
                uid: this.uid,
                sequence_number: this.sequence_number,
            };

            if (this['return_mode'] === "voucher") {
                res['return_mode'] = this['return_mode'];
            }

            return res;

        },
    });


    var PaymentlineSuper = module.Paymentline;
    module.Paymentline = module.Paymentline.extend({
        initialize: function (attributes, options) {
            res = PaymentlineSuper.prototype.initialize.call(this, attributes, options);

            // How to protect this?
            this.voucher = false
        },


        set_amount: function (value) {
            var self = this;
            if (self.voucher) {
                var currentOrder = this.pos.get('selectedOrder');
                var paidTotal = currentOrder.getPaidTotal();
                var dueTotal = currentOrder.getTotalTaxIncluded();
                var remaining = dueTotal > paidTotal ? dueTotal - paidTotal : 0;
                value = remaining > 0 ? remaining : dueTotal;
                if (self.voucher.amount < remaining) {
                    value = self.voucher.amount
                } else if (dueTotal < 0) {
                    value = dueTotal;
                }

                //value now is correct!
                var rounding = self.pos.currency.rounding;
                value = round_pr(value, rounding).toFixed(2);
                this.node.querySelector('input').value = value.toString().replace(".", ",");
            }

            PaymentlineSuper.prototype.set_amount.call(this, value);
        },

        set_voucher: function (payment_line, voucher) {
            if (this.voucher !== voucher) {
                this.voucher = voucher;
                payment_line.set_amount(voucher.amount);
            }
            this.trigger('change:voucher', this);
        },
        get_voucher: function () {
            return this.voucher;
        }
    });


    module.PaypadButtonWidget = module.PaypadButtonWidget.extend({
        renderElement: function () {
            this._super();
            var self = this;


            this.$el.click(_.bind(function () {
                var currentOrder = this.pos.get('selectedOrder');
                paymentLines = currentOrder.get('paymentLines');
                line_for_voucher = false
                for (var i = 0, len = paymentLines.length; i < len; i++) {
                    payment_line = paymentLines.models[i];
                    if (!payment_line.voucher && payment_line.cashregister.journal.voucher_journal && payment_line.cashregister.id === self.cashregister.id) {
                        line_for_voucher = payment_line;
                        break;
                    }
                }
                ;
                if (line_for_voucher) {

                    /**block when return products*/
                    if (self.pos.pos_widget.action_bar.buttons.validation.hide == true) {
                        currentOrder.removePaymentline(line_for_voucher)
                        console.log("jcm block when return products")
                    } else {
                        self.pos.pos_widget.voucher_screen.payment_line = line_for_voucher
                        self.pos.pos_widget.screen_selector.set_current_screen('voucherscreen')
                    }
                }
                ;
            }, self));
        }
    });


    module.PaymentScreenWidget = module.PaymentScreenWidget.extend({
        init: function (parent, options) {
            var self = this;
            this._super(parent, options);


            /**Override event handler enter keyup when validate order*/
            this.hotkey_handler = function (event) {
                if (event.which === 13) {
                    if (self.pos.pos_widget.action_bar.buttons.validation.disabled && !self.pos.pos_widget.action_bar.buttons.return_voucher.disabled)
                        /**When return voucher button visible, call validate_return*/
                        self.validate_return_order();
                    else
                        self.validate_order();

                } else if (event.which === 27) {
                    self.back();
                }

            };


        },

        show: function () {
            this._super();
            var self = this;

            var voucher_btn = this.add_action_button({
                label: _t('Create Voucher'),
                name: 'return_voucher',
                icon: '/pos_return_voucher/static/src/img/scan48.png',
                click: function () {
                    self.validate_return_order();
                },
            });

            //todo: delete this statement, now raw img has 48px
            //voucher_btn.$('img').css('height', '40px');

            // Hide 'Validate' & 'Invoice' buttons if return order
            var currentOrder = this.pos.get('selectedOrder');
            if (currentOrder.getTotalTaxIncluded() < 0) {
                //add jcm routine
                if (currentOrder.selected_paymentline) {
                    console.log("hay seleccionado una linea de pagocon: " + currentOrder.selected_paymentline.amount)
                    this.pos_widget.action_bar.set_button_disabled('return_voucher', true);
                    this.pos_widget.action_bar.set_button_disabled('validation', false);
                    this.pos_widget.action_bar.set_button_disabled('invoice', false);
                } else {
                    this.pos_widget.action_bar.set_button_disabled('validation', true);
                    this.pos_widget.action_bar.set_button_disabled('invoice', true);
                }
            } else {
                this.pos_widget.action_bar.set_button_disabled('return_voucher', true);
            }
            this.pos_widget.payment_screen.next_screen = 'receipt';
        },

        back: function () {
            this._super();
            console.log("back metodo srceen selector")
            var currentOrder = this.pos.get('selectedOrder');
            if (currentOrder.getTotalTaxIncluded() < 0) {
                //reset order lines & trigger current order
                currentOrder.get('orderLines').reset();
                this.pos_widget.order_widget.change_selected_order();
            }

            var paymentlines = currentOrder.get('paymentLines').models;
            _.each(paymentlines, function (line) {
                currentOrder.removePaymentline(line) // now remove all payment lines
            });
        },

        create_voucher: function () {
            var self = this;
            var currentOrder = this.pos.get('selectedOrder');
            var total = currentOrder.getTotalTaxIncluded();
            var config = this.pos.config;
            var due_date = false
            if (config.vouchers_expire) {
                due_date = new Date();
                due_date.setDate(due_date.getDate() + config.voucher_validity_period);
            }

            var vals = {
                'amount': total * -1,
                'due_date': due_date,
                'session_id': this.pos.pos_session.id
            }

            var posVoucherModel = new instance.web.Model('pos.voucher')

            /***init modify jcm**/
            var partner_id = currentOrder.get_client() || false
            var pos_order_ref = this.pos.pos_widget.return_products_popup.order.ref;
            var barcode_voucher = config.barcode_voucher.replace("*", "")
            return posVoucherModel.call('create_from_ui',
                [vals, pos_order_ref,
                    barcode_voucher,
                    partner_id.id]) //pass ref order also
            /**end modify jcm***/
                .then(function (result) {
                    return result;
                }).fail(function (error, event) {
                    if (parseInt(error.code) === 200) {
                        // Business Logic Error, not a connection problem
                        self.pos.pos_widget.screen_selector.show_popup(
                            'error-traceback', {
                                message: error.data.message,
                                comment: error.data.debug
                            }
                        );
                    }
                    else {
                        self.pos_widget.screen_selector.show_popup('error', {
                            message: _t('Connection error'),
                            comment: _t('Can not execute this action because the POS is currently offline'),
                        });
                    }
                });
        },

        //Todo: delete unnecessary code
        validate_order: function (options) {
            // TODO check voucher in py before validate order?
            // the voucher is checked from js

            var self = this;
            var options = options || {};
            var currentOrder = this.pos.get('selectedOrder');

            if (self.pos.pos_widget.payment_screen.is_locked_order()) {
                console.log("jcm current order is locked aborting operation...")
                return;
            }


            /** Validate empty order*/
            if (currentOrder.get('orderLines').models.length === 0) {
                this.pos_widget.screen_selector.show_popup('error', {
                    'message': _t('Empty Order'),
                    'comment': _t('There must be at least one product in your order before it can be validated'),
                });
                return;
            }

            /** Validate when order will be invoiced*/
            if (options.invoice) {
                if (!currentOrder.get('client')) {
                    self.pos_widget.screen_selector.show_popup('error', {
                        message: _t('An anonymous order cannot be invoiced'),
                        comment: _t('Please select a client for this order. This can be done by clicking the order tab'),
                    });
                    return;
                }
            }

            var paymentLines = currentOrder.get('paymentLines')
            var datas = [];
            var vouchers = [];
            for (var i = 0, len = paymentLines.length; i < len; i++) {
                var payment_line = paymentLines.models[i];
                var pay_voucher;
                if (payment_line.voucher) {
                    pay_voucher = payment_line.voucher;

                    var voucher = {
                        name: pay_voucher.name,
                        amount: pay_voucher.amount - payment_line.amount,
                        due_date: pay_voucher.due_date
                    };

                    vouchers.push(voucher);

                    var data = {
                        'voucher_id': pay_voucher.id,
                        'amount': payment_line.amount,
                        'order_ref': currentOrder.get('name') // pasamos tambien el nombre pedido
                    }
                    var config = this.pos.config;
                    if (payment_line.amount < 0 && config.vouchers_expire) {
                        var due_date = new Date();
                        due_date.setDate(due_date.getDate() + config.voucher_validity_period);
                        var current_date = new Date(pay_voucher.due_date);
                        if (due_date > current_date) {
                            //data.push({'new_due_date': due_date});
                            _.extend(data, {'new_due_date': due_date})
                        }
                    }
                    datas.push(data);
                }
            }

            ok = new $.Deferred()
            if (datas.length > 0) {
                //set timeout until create order backend
                setTimeout(function () {
                    var voucherModel = new instance.web.Model('pos.voucher');
                    voucherModel.call('use_voucher', [datas])
                        .then(function (result) {
                            ok.resolve(result)
                        })
                        .fail(function (error, event) {
                            ok.reject([])
                            if (parseInt(error.code) === 200) {
                                // Business Logic Error, not a connection problem
                                self.pos_widget.screen_selector.show_popup(
                                    'error-traceback', {
                                        message: error.data.message,
                                        comment: error.data.debug
                                    }
                                );
                            }
                            else {
                                self.pos_widget.screen_selector.show_popup('error', {
                                    message: _t('Connection error'),
                                    comment: _t('Can not execute this action because the POS is currently offline'),
                                });
                            }
                        });
                }, 1500);

            }

            _.extend(currentOrder, {vouchers: vouchers});

            ok.done(function (result) {
                if (result.length > 0) {
                    var order = self.pos.get('selectedOrder');
                    _.extend(order, {'vouchers': result});
                    /**Need refresh ticket for Google Chrome
                     * for correct print barcode*/
                    self.pos.pos_widget.receipt_screen.refresh()
                }
            });

            /**
             * Need refresh ticket for Google Chrome
             * for correct print barcode
             * Refresh ticket also in no deferred operations
             * For example, when create a new voucher*/
            self.pos.pos_widget.receipt_screen.refresh()

            /**Finally calls super method*/

            this._super(options);
        },

        // TODO: Refactor
        validate_return_order: function () {
            var self = this;
            var currentOrder = this.pos.get('selectedOrder');

            if (self.pos.pos_widget.payment_screen.is_locked_order()) {
                console.log("jcm current order is locked aborting operation... from validate_return_voucher()")
                return;
            }

            var create_new_voucher = false;
            var voucher = false;
            //jcm add property json order
            currentOrder['return_mode'] = "voucher";
            var paymentLines = currentOrder.get('paymentLines');
            //if (paymentLines.length > 1) { old statement
            if (paymentLines.length > 0) {
                self.pos_widget.screen_selector.show_popup('error', {
                    message: _t('Voucher Error'),
                    comment: _t('There can only be one payment line in returns. Please, select one and delete the others.'),
                });
                return;
            } else if (paymentLines.length == 1) {

                var payment_line = paymentLines.models[0];
                if (payment_line.voucher) {
                    voucher = payment_line.voucher;
                } else {
                    create_new_voucher = true;
                }
            } else {
                create_new_voucher = true;
            }

            // TODO: Refactor, NOT DRY
            // Todo: validate deferred fail connection server case
            // Todo: change order name when create new Voucher

            var ok = new $.Deferred();
            if (create_new_voucher) {
                voucher = this.create_voucher().done(function (voucher) {
                    ok.resolve(voucher)
                });


                // routine for save qty return order lines ids
                // TODO: this should be if create_new_voucher condition?
                // declare how var to variables
                olines = self.pos.pos_widget.return_products_popup.order.orderlines
                ReturnLinesModel = new instance.web.Model('pos.order.line.return.quantity.ids')
                ids = []
                _.each(olines, function (line) {
                    ids.push({'id': line.id, 'qty': line.qty})
                });
                ReturnLinesModel.call('add_line_return_qty_ids', [ids]).then(function (res) {
                    console.log(res + "jcm <<<<<<<<<<<<<<< new pos.order.line.return.id")
                });

            } else {
                ok.resolve(voucher)
            }

            ok.done(function (voucher) {
                currentOrder.set_used_voucher(voucher);
                self.validate_order();
            })
        },
    });


    module.PosWidget = module.PosWidget.extend({
        build_widgets: function () {
            this._super();
            // Init voucher popup
            this.voucher_screen = new module.VoucherScreenWidget(this, {'message': _t('Choose a voucher')});
            this.voucher_screen.appendTo(this.$el);
            this.voucher_screen.hide();
            this.screen_selector.screen_set['voucherscreen'] =
                this.voucher_screen;
        },
    });

    module.ScreenWidget = module.ScreenWidget.extend({
        init: function (parent, options) {
            this._super(parent, options);

        },

        barcode_voucher_action: function (code) {
            //this.search_vouchers(code.code) read code
            return true
        },

        show: function () {
            var self = this;
            this._super();
            this.pos.barcode_reader.set_action_callback({
                'voucher': self.barcode_voucher_action ? function (code) {
                    self.barcode_voucher_action(code);
                } : undefined,
            });

        },

    });


    module.VoucherScreenWidget = module.ScreenWidget.extend({
        template: 'VoucherScreenWidget',
        model: 'pos.voucher',

        init: function (parent, options) {
            this.options = options || {};
            this.message = options.message || '';
            this.payment_line = options.payment_line;
            options.search = this.search_vouchers;
            options.cancel = this.cancel_select_voucher;
            this._super(parent, options);
        },

        show_leftpane: false,

        auto_back: true,

        show: function () {
            var self = this;
            this._super();
            this.renderElement()
            this.search_vouchers();
            var search_timeout = null;

            this.$el.find('.searchbox input').on('keyup', function () {
                console.log("jcm keyup searchbox voucher screen <<<<<<" + " value:" + this.value)
                clearTimeout(search_timeout);

                var query = this.value;

                search_timeout = setTimeout(function () {
                    self.search_vouchers(query);
                }, 70);
            });

            this.$('.searchbox .search-clear').click(function () {
                self.clear_search();
            });

            this.$('.cancel').click(function () {
                self.cancel_select_voucher()
                self.pos_widget.screen_selector.back();
            });

        },


        cancel_select_voucher: function () {
            this.pos.get('selectedOrder').removePaymentline(this.payment_line);
        },

        render_voucher_list: function (vouchers) {
            var self = this;
            var current_order = this.pos.get('selectedOrder');

            var picked_voucher_ids = current_order.get_picked_vouchers()
            var contents = this.$('.voucher-list-contents')
            contents[0].innerHTML = '';

            for (var i = vouchers.length - 1; i >= 0; i--) {
                var voucher = vouchers[i];
                var voucher_html = $(QWeb.render('LoadVoucherLine',
                    {widget: this, voucher: voucher}));

                if (voucher.due_date) {
                    var yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    //arr_date = voucher.due_date.split('-')
                    var arr_date = voucher.due_date.split('/')
                    //var voucher_due_date = new Date(arr_date[0], arr_date[1], arr_date[2])
                    var voucher_due_date = new Date(arr_date[2], arr_date[1], arr_date[0])
                }
                if (picked_voucher_ids.indexOf(voucher.id) == -1 &&
                    voucher.amount > 0 &&
                    (!voucher.due_date || voucher_due_date > yesterday)) {
                    voucher_html.click(_.bind(function () {

                        // Set the voucher
                        self.payment_line.set_voucher(self.payment_line, this);
                        self.pos_widget.screen_selector.set_current_screen('payment');
                    }, voucher));
                } else {
                    voucher_html.addClass('disabled')
                }
                contents.append(voucher_html)
            }
            ;
        },

        search_vouchers: function (query) {
            var self = this;
            var order = self.pos.get_order();
            var curr_client = self.pos.get_order().get_client() || false;
            var voucherModel = new instance.web.Model(this.model);
            return voucherModel.call('search_vouchers', [query || '', curr_client.id])
                .then(function (result) {
                    self.render_voucher_list(result, self.payment_line)
                }).fail(function (error, event) {
                    if (parseInt(error.code) === 200) {
                        // Business Logic Error, not a connection problem
                        self.pos_widget.screen_selector.show_popup(
                            'error-traceback', {
                                message: _t(error.data.message),
                                comment: _t(error.data.debug)
                            }
                        );
                    }
                    else {
                        self.pos_widget.screen_selector.show_popup('error', {
                            message: _t('Connection error'),
                            comment: _t('Can not execute this action because the POS is currently offline'),
                        });
                    }
                });
        },

        clear_search: function () {
            var customers = this.pos.db.get_partners_sorted(1000);
            this.search_vouchers()
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
        },
    });
}
