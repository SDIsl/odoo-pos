/* © 2015 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
 */

openerp.pos_return_products = function (instance, local) {
    module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;


    module.PosWidget = module.PosWidget.extend({
        build_widgets: function () {
            this._super();
            var self = this;

            // Init orders to return list screen
            this.return_screen = new module.ReturnScreenWidget(this, {});
            this.return_screen.appendTo(this.$('.screens'));
            this.return_screen.hide();
            this.screen_selector.screen_set['returnproducts'] =
                this.return_screen;

            // Init return products popup
            this.return_products_popup = new module.ReturnProductsPopupWidget(this, {});
            this.return_products_popup.appendTo(this.$el);
            this.return_products_popup.hide();
            this.screen_selector.popup_set['returnproductspopup'] =
                this.return_products_popup;

            // Add return products button
            var returnproducts_btn = document.createElement('span');
            $(returnproducts_btn).append('<i class="fa fa-undo"></i>')
            //$(returnproducts_btn).append("<span>" + _t('Returns') + "</span>");
            $(returnproducts_btn).append(_t('Returns'));
            $(returnproducts_btn).click(function (e) {
                var ss = self.pos.pos_widget.screen_selector;
                if (ss.get_current_screen() !== 'products') {
                    self.pos_widget.screen_selector.show_popup(
                        'error', {
                            message: _t("You only can do returns in product screen"),
                            comment: _t("Go to product screen for do it.")
                        }
                    );
                    return;
                }
                ss.set_current_screen('returnproducts');
            });

            $(returnproducts_btn).css({
                'font-size': '1.2em',
                'font-weight': 'bold',
            });


            //this.$('.sub-menu.left').append(returnproducts_btn);
            $(returnproducts_btn).addClass('order-button');
            $(returnproducts_btn).addClass('return-btn');


            $(returnproducts_btn).insertAfter('.order-selector');
        },
    });


    module.ReturnScreenWidget = module.GreatRightScreen.extend({
        model: 'pos.order',
        current_order_id: 0,

        init: function (parent, options) {
            this._super(parent, options);
        },

        renderElement: function () {
            var self = this;
            this._super();

            table_orders_return = QWeb.render('OrdersReturnTable',
                {widget: this});

            content = this.$('.content');
            content.append(table_orders_return);
        },

        show: function (options) {
            options = options || {};
            options.cancel = this.cancel_return;
            options.search = this.search_orders;

            this._super(options);
            this.search_orders();
        },

        cancel_return: function () {
            var self = this;

            order = self.pos.get('selectedOrder');
            order.get('orderLines').reset();
            order.set_client(undefined);

            self.pos_widget.order_widget.change_selected_order();
            var ss = self.pos.pos_widget.screen_selector;
            ss.set_current_screen('products');
        },

        search_orders: function (query) {
            var self = this;
            var orderModel = new instance.web.Model(this.model);
            return orderModel.call('search_orders_to_return', [query || ''])
                .then(function (result) {
                    self.render_order_list(result);
                }).fail(function (error, event) {
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
        },

        render_order_list: function (orders) {
            var self = this;
            var contents = this.$('.order-list-contents');
            contents.innerHTML = "";
            contents.text('')
            for (var i = 0, len = orders.length; i < len; i++) {
                var order = orders[i];
                var orderline_html = QWeb.render('LoadReturnOrderLine',
                    {widget: this, order: orders[i]});
                var orderline = document.createElement('tbody');
                orderline.innerHTML = orderline_html;
                orderline = orderline.childNodes[1];
                orderline.addEventListener('click', function () {
                    self.current_order_id = parseInt(this.dataset['orderId']);
                    self.pos.pos_widget.screen_selector.show_popup('returnproductspopup', {
                        'message': _t('Choose the products and quantity to return'),
                        'order_id': self.current_order_id
                    });
                });
                contents.append(orderline);
            }
        },

        load_order_fields: function (order, fields) {
            var partner = this.pos.db.get_partner_by_id(
                fields.partner_id);
            order.set_client(partner || undefined);
            return order;
        },

        prepare_orderline_options: function (orderline) {
            return {
                quantity: orderline.qty,
                price: orderline.price_unit,
                discount: orderline.discount,
            };
        },
    });


    module.ReturnProductsPopupWidget = module.ConfirmPopupWidget.extend({
        template: 'ReturnProductsPopupWidget',
        model: 'pos.order',

        show: function (options) {
            options = options || {};
            options.confirm = this.confirm_return;
            order_id = options.order_id;

            this._super(options);
            this.order_id = order_id;

            var self = this;
            var orderModel = new instance.web.Model(this.model);

            this.list = options.list || [];

            return orderModel.call('load_order_to_return', [order_id])
                .then(function (result) {
                    self.render_order_list(result)
                });

        },

        confirm_return: function () {
            orderlines = this.order.orderlines;
            var self = this;
            current_order = this.pos.get('selectedOrder');
            order = this.load_order_fields(current_order, this.order);
            order.get('orderLines').reset();
            var orderlines = this.order.orderlines || [];
            var unknown_products = [];
            for (var i = 0, len = orderlines.length; i < len; i++) {
                var orderline = orderlines[i];
                if (orderline) {
                    var product_id = orderline.product_id[0];
                    var product_name = orderline.product_id[1];
                    var product = self.pos.db.get_product_by_id(product_id);
                    if (_.isUndefined(product)) {
                        unknown_products.push(product_name);
                        continue;
                    }

                    for (key in orderline) {
                        if (!key.indexOf('product__')) {
                            product = self.add_product_attribute(
                                product, key, orderline
                            );
                        }
                    }

                    order.addProduct(product,
                        self.prepare_orderline_options(orderline)
                    );
                    last_orderline = order.getLastOrderline();
                    last_orderline = jQuery.extend(last_orderline, orderline);
                }
            }
            self.pos_widget.screen_selector.set_current_screen('payment');
            //jcm hide button validate (show vouch button hide validate)
            /*self.pos_widget.action_bar.set_button_hidden('validation', true);
             self.pos_widget.action_bar.set_button_hidden('return_voucher', false);*/
        },

        prepare_orderline_options: function (orderline) {
            return {
                quantity: orderline.qty * -1,
                price: orderline.price_unit,
                discount: orderline.discount,
            };
        },

        load_order_fields: function (order, fields) {
            var partner = this.pos.db.get_partner_by_id(
                fields.partner_id);
            order.set_client(partner || undefined);
            return order;
        },

        render_order_list: function (orders) {
            var self = this;
            order = orders[0]
            this.order = order;
            orderlines = order['orderlines']

            // Write the order reference
            this.$('.order-ref').append(order['name'])

            for (var i = 0, len = orderlines.length; i < len; i++) {
                orderline = orderlines[i];
                orderline.original_qty = orderline.qty;
                orderline.parent = order;
                orderline.arr_id = i;

                var orderline_html = $(QWeb.render('LoadProductLine',
                    {widget: this, orderline: orderline}));
                orderline.html = orderline_html;

                qty_field = orderline_html.find('.qty')
                qty_field.wrapInner(
                    $(document.createElement('span')).addClass('num'));

                // Plus qty button
                plus_btn = $(document.createElement('i'));
                plus_btn.addClass('minus fa fa-plus-square');
                qty_field.append(plus_btn);
                plus_btn.click(_.bind(function () {
                    if (this.qty < this.original_qty) {
                        this.qty += 1;
                        this.html.find('.num')[0].innerHTML = this.qty;
                    }
                }, orderline));

                // Minus qty button
                minus_btn = $(document.createElement('i'));
                minus_btn.addClass('plus fa fa-minus-square');
                qty_field.prepend(minus_btn);
                minus_btn.click(_.bind(function () {
                    if (this.qty > 1) {
                        this.qty -= 1;
                        this.html.find('.num')[0].innerHTML = this.qty;
                    }
                }, orderline));

                // Delete product button
                delete_btn = orderline_html.find('.del-btn');
                delete_btn.click(_.bind(function () {
                    this.html.animate({
                        opacity: 0,
                        width: 0,
                    }, 150, function () {
                        $(this).css('display', 'none');
                        this.parentNode.removeChild(this);
                    });
                    delete this.parent.orderlines[this.arr_id]
                }, orderline));

                this.$('.product-list-contents').append(orderline_html)
            }
            ;
        },
    });
}
