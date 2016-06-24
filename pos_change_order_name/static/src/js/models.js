/**
 * Created by JCarlos Montoya on 11/03/2016.
 */
openerp.pos_change_order_name = function (instance) {
    var _t = instance.web._t
    var module = instance.point_of_sale;

    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        initialize: function (session, attributes) {
            this.last_order_ids = {};
            this.sequence = {}
            PosModelSuper.prototype.initialize.call(this, session, attributes);

        },

        /**Load POS Sequence*/
        load_server_data: function () {
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);
            loaded = loaded.then(function () {
                return self.fetch(
                    'ir.sequence',
                    ['name', 'prefix', 'padding', 'number_next_actual', 'suffix'],
                    [['id', '=', self.config.sequence_id[0]]],
                    {}
                );
            }).then(function (sequence) {
                self.sequence = sequence[0];
                return $.when();
            });
            return loaded;
        },

        /**Override push_order and get order ids backend**/
        push_order: function (order) {
            var self = this;

            if (order) {
                this.proxy.log('push_order', order.export_as_JSON());
                this.db.add_order(order.export_as_JSON());
            }
            var pushed = new $.Deferred();
            this.flush_mutex.exec(function () {
                var flushed = self._flush_orders(self.db.get_orders());

                flushed.always(function (ids) {
                    pushed.resolve(ids); // $.Deferred return ids now
                    self.last_order_ids['ids'] = {}
                    self.last_order_ids['ids'] = ids;
                });
            });
            return pushed
        },
    });

    module.PaymentScreenWidget = module.PaymentScreenWidget.extend({

        locked_order: function (value) {
            var currentOrder = this.pos.get('selectedOrder');
            $(currentOrder).data('locked', value);
        },

        is_locked_order: function () {
            var currentOrder = this.pos.get('selectedOrder');
            return $(currentOrder).data('locked');
        },

        /* validate order init override*/
        validate_order: function (options) {
            var self = this;
            options = options || {};
            var currentOrder = this.pos.get('selectedOrder');

            //Check when current order is locked second time call this method
            if (this.is_locked_order()) {
                return;
            }

            //first time current order will be locked
            this.locked_order(false)
            if (!this.is_locked_order()) { // block operation concurrency "Callbacks RPC"
                this.locked_order(true);

                if (currentOrder.get('orderLines').models.length === 0) {
                    this.pos_widget.screen_selector.show_popup('error', {
                        'message': _t('Empty Order'),
                        'comment': _t('There must be at least one product in your order before it can be validated'),
                    });

                    if (this.is_locked_order()) {
                        this.locked_order(false);
                    }
                    return;
                }

                 var plines = currentOrder.get('paymentLines').models;
                 for (var i = 0; i < plines.length; i++) {
                    if (plines[i].get_type() === 'bank' && plines[i].get_amount() < 0) {
                        this.pos_widget.screen_selector.show_popup('error', {
                            'message': _t('Negative Bank Payment'),
                            'comment': _t('You cannot have a negative amount in a Bank payment. Use a cash payment method to return money to the customer.'),
                        });

                        if (this.is_locked_order()) {
                            this.locked_order(false);
                        }
                        return;
                    }
                }

                if (!this.is_paid()) {
                    if (this.is_locked_order()) {
                        this.locked_order(false);
                    }
                    return;
                }

                // The exact amount must be paid if there is no cash payment method defined.
                if (Math.abs(currentOrder.getTotalTaxIncluded() - currentOrder.getPaidTotal()) > 0.00001) {
                    var cash = false;
                    for (var i = 0; i < this.pos.cashregisters.length; i++) {
                        cash = cash || (this.pos.cashregisters[i].journal.type === 'cash');
                    }
                    if (!cash) {
                        this.pos_widget.screen_selector.show_popup('error', {
                            message: _t('Cannot return change without a cash payment method'),
                            comment: _t('There is no cash payment method available in this point of sale to handle the change.\n\n Please pay the exact amount or add a cash payment method in the point of sale configuration'),
                        });

                        if (this.is_locked_order()) {
                            this.locked_order(false);
                        }

                        return;
                    }
                }

                if (this.pos.config.iface_cashdrawer) {
                    this.pos.proxy.open_cashbox();
                }

                if (options.invoice) {
                    // deactivate the validation button while we try to send the order
                    this.pos_widget.action_bar.set_button_disabled('validation', true);
                    this.pos_widget.action_bar.set_button_disabled('invoice', true);

                    var invoiced = this.pos.push_and_invoice_order(currentOrder);

                    invoiced.fail(function (error) {
                        if (error === 'error-no-client') {
                            self.pos_widget.screen_selector.show_popup('error', {
                                message: _t('An anonymous order cannot be invoiced'),
                                comment: _t('Please select a client for this order. This can be done by clicking the order tab'),
                            });
                        } else {
                            self.pos_widget.screen_selector.show_popup('error', {
                                message: _t('The order could not be sent'),
                                comment: _t('Check your internet connection and try again.'),
                            });
                        }
                        self.pos_widget.action_bar.set_button_disabled('validation', false);
                        self.pos_widget.action_bar.set_button_disabled('invoice', false);

                        /** unlock current order*/
                        if (self.is_locked_order()) {
                            self.locked_order(false);
                        }
                    });

                    invoiced.done(function () {
                        self.pos_widget.action_bar.set_button_disabled('validation', false);
                        self.pos_widget.action_bar.set_button_disabled('invoice', false);
                        self.pos.get('selectedOrder').destroy();
                        /** unlock current order*/
                        if (self.is_locked_order()) {
                            self.locked_order(false);
                        }
                    });

                } else {

                    self.pos.push_order(currentOrder).done(function (ids) {
                        var index_ids = ids.length;
                        var PosOrderModel = new instance.web.Model('pos.order');
                        PosOrderModel.call('get_last_order_id', [ids[index_ids - 1]]).done(function (res) {
                            var order = self.pos.get('selectedOrder');
                            if (typeof res == 'object') {
                                order.set('name', res[0].name)
                                self.pos.last_order_ids['last_order_info'] = res[0]
                            }
                            /** unlock current order*/
                            if (self.is_locked_order()) {
                                self.locked_order(false);
                            }

                        }).fail(function (error, event) {
                            if (error.code === 200) {    // Business Logic Error, not a connection problem
                                self.pos_widget.screen_selector.show_popup('error-traceback', {
                                    message: error.data.message,
                                    comment: error.data.debug
                                });
                            }
                            // prevent an error popup creation by the rpc failure
                            // we want the failure to be silent as we send the orders in the background
                            event.preventDefault();
                            console.error(error.data.message + _t('Failed to get las order id'));

                            /** unlock current order*/
                            if (self.is_locked_order()) {
                                self.locked_order(false);
                            }

                            var prefix = self.pos.sequence.prefix;
                            var last_number;
                            var next_number;
                            var next_name = "";
                            /**Check if we have the last created pos order*/
                            /**This routine can be improved*/
                            if (self.pos.last_order_ids.last_order_info) {
                                last_number = self.pos.last_order_ids.last_order_info.name.slice(prefix.length);
                                next_number = parseInt(last_number) + 1;
                                next_name = "";

                                var number_length = next_number.toString().length;

                                /**Zero Fill Left*/
                                next_name = self.zero_fill(number_length, next_name)

                                next_name += next_number.toString();
                                next_name = prefix + next_name;
                                var last_id = self.pos.last_order_ids.last_order_info.id;
                                self.pos.last_order_ids.last_order_info = {
                                    id: last_id + 1,
                                    name: next_name
                                };

                            } else {
                                last_number = self.pos.sequence.number_next_actual;
                                next_number = parseInt(last_number);
                                var number_length = next_number.toString().length;

                                /**Zero Fill Left*/
                                next_name = self.zero_fill(number_length, next_name)

                                next_name += next_number.toString();
                                next_name = prefix + next_name;
                                self.pos.last_order_ids.last_order_info = {
                                    id: undefined,
                                    name: next_name
                                };
                            }
                            currentOrder.set('name', next_name);

                        }).always(function () {
                            instance.webclient.loading.$el.text("");
                            if (self.pos.config.iface_print_via_proxy) {
                                var receipt = currentOrder.export_for_printing();
                                self.pos.proxy.print_receipt(QWeb.render('XmlReceipt', {
                                    receipt: receipt, widget: self,
                                }));
                                self.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
                            } else {
                                self.pos_widget.screen_selector.set_current_screen(self.next_screen);
                            }
                            instance.webclient.loading.$el.text(_t("Loading"));
                        });
                    });
                }

                // hide onscreen (iOS) keyboard
                setTimeout(function () {
                    document.activeElement.blur();
                    $("input").blur();
                }, 250);
            } else {
                return;
            }
        },
        /* validate order override end*/

        zero_fill: function (start, out) {
            for (var i = start; i < this.pos.sequence.padding; i++) {
                out += "0";
            }
            return out
        },
    });

}