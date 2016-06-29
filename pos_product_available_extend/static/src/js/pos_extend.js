openerp.pos_product_available_extend = function (instance) {
    var module = instance.point_of_sale;
    var PosModelSuper = module.PosModel
    var _t = instance.web._t;
    module.PosModel = module.PosModel.extend({
        load_server_data: function () {
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);
            loaded = loaded.then(function () {
                return self.fetch(
                    'product.product',
                    ['incoming_qty'],
                    [['sale_ok', '=', true], ['available_in_pos', '=', true]],
                    {'location': self.config.stock_location_id[0]}
                );

            }).then(function (products) {
                $.each(products, function () {
                    $.extend(self.db.get_product_by_id(this.id) || {}, this);
                });
                return $.when()
            })
            return loaded;
        },

        refresh_qty_available: function (product) {
            var incoming_qty = $("[data-product-id='" + product.id + "'] .incoming-qty");
            if (product.incoming_qty > 0) {
                incoming_qty.html(product.incoming_qty);
            }
            //we call function original
            PosModelSuper.prototype.refresh_qty_available.call(this, product);
        },
    });

    /**Override update_products_ui pos_pricelist module**/
    var ParentPricelistEngine = module.PricelistEngine;
    module.PricelistEngine = module.PricelistEngine.extend({

        update_products_ui: function (partner) {
            var db = this.db;
            if (!this.pos_widget.product_screen) return;
            var product_list_ui
                = this.pos_widget.product_screen.$(
                '.product-list span.product'
            );
            for (var i = 0, len = product_list_ui.length; i < len; i++) {
                var product_ui = product_list_ui[i];

                //tooltip stock available
                $(product_ui).find('.qty-tag').attr('data-original-title', _t('Available'));
                $(product_ui).find('.qty-tag').attr('data-toggle', 'tooltip');
                $(product_ui).find('.qty-tag').tooltip({
                    delay: {
                        show: 50,
                        hide: 100
                    }
                });

                //tooltip stock incoming
                $(product_ui).find('.incoming-qty').attr('data-original-title', _t('Incoming'));
                $(product_ui).find('.incoming-qty').attr('data-toggle', 'tooltip');
                $(product_ui).find('.incoming-qty').tooltip({
                    delay: {
                        show: 50,
                        hide: 100
                    }
                });
            }
            ParentPricelistEngine.prototype.update_products_ui.call(this, partner);
        },

    });

    /************************** toolip variants ****************/
    module.VariantListWidget = module.VariantListWidget.extend({
        renderElement: function () {
            this._super();
            var self = this;
            var el_html = openerp.qweb.render(this.template, {widget: this});
            var el_node = document.createElement('div');
            el_node.innerHTML = el_html;
            el_node = el_node.childNodes[1];
            if (this.el && this.el.parentNode) {
                this.el.parentNode.replaceChild(el_node, this.el);
            }
            this.el = el_node;
            var list_container = el_node.querySelector('.variant-list');
            for (var i = 0, len = this.filter_variant_list.length; i < len; i++) {
                var variant_node = this.render_variant(this.filter_variant_list[i]);
                variant_node.addEventListener('click', this.click_variant_handler);
                list_container.appendChild(variant_node);


                /*tooltip stock qty available*/
                $(variant_node).find('.qty-tag').attr('data-original-title', _t('Available'));
                $(variant_node).find('.qty-tag').attr('data-toggle', 'tooltip');
                $(variant_node).find('.qty-tag').tooltip({
                    delay: {
                        show: 50,
                        hide: 100
                    }
                });

                /*tooltip stock incoming qty*/
                var variant_id = $(variant_node).data('variant-id');
                var variant = this.pos.db.get_product_by_id(variant_id);
                if (variant.incoming_qty > 0) {

                    $(variant_node).find('.incoming-qty').attr('data-original-title', _t('Incoming'));
                    $(variant_node).find('.incoming-qty').attr('data-toggle', 'tooltip');
                    $(variant_node).find('.incoming-qty').tooltip({
                        delay: {
                            show: 50,
                            hide: 80
                        }
                    });
                }
            }
        },
    });
}

