/* © 2015 FactorLibre - Ismael Calvo <ismael.calvo@factorlibre.com>
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
 */

openerp.pos_sub_menu_widget = function(instance) {
    module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;


    module.PosWidget = module.PosWidget.extend({
        build_widgets: function() {
            this._super();

            // Add sub-menu widget
            this.sub_menu = new module.LeftSubMenuWidget(this,{});
            this.sub_menu.prependTo($('.pos-leftpane .window'));
            this.screen_selector.screen_set['submenu_left'] =
                this.sub_menu;
        },
    });


    module.LeftSubMenuWidget = module.PosBaseWidget.extend({
        template: 'LeftSubMenuWidget',
    });


    module.CleanRightScreen = module.PosBaseWidget.extend({
        template: 'CleanRightScreen',
    });


    module.GreatRightScreen = module.ScreenWidget.extend({
        template: 'GreatRightScreen',

        show: function(options) {
            var self = this;
            this._super();
            this.renderElement();

            this.$el.find('button.cancel').click(function(){
                if( options.cancel ){
                    options.cancel.call(self);
                }
            });

            this.$el.find('.searchbox input').on('keyup',function(){
                query = this.value;

                if( options.search ){
                    options.search.call(self, query);
                }
            });
        },

    });
}