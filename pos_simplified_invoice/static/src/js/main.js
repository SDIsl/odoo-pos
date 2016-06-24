/**
 *
 "@author: Juan Carlos Montoya <juancarlos.montoya.chamba@gmail.com>
 *
 */

openerp.pos_simplified_invoice = function (instance) {
    var module = instance.point_of_sale;
    var PosModelSuper = module.PosModel;
    module.PosModel = module.PosModel.extend({
        load_server_data: function () {
            var self = this;
            var loaded = PosModelSuper.prototype.load_server_data.call(this);

            loaded = loaded.then(function () {
                return self.fetch(
                    'res.company',
                    ['street', 'state_id', 'city'],
                    []
                );

            }).then(function (companies) {
                _.extend(self.company || {}, companies[0])

                return $.when()
            })
            return loaded;
        },
    });


    var OrderParent = module.Order;
    module.Order = module.Order.extend({
        initialize: function (attributes) {
            OrderParent.prototype.initialize.apply(this, arguments);
            //cambiamos el nombre para que solo aparezca el numero de serie
            this.set('name', this.uid);
        },
    });
};

