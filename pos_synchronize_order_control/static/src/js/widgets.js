/**
 * Created by JCarlos Montoya on 17/05/2016.
 */
openerp.pos_synchronize_order_control = function (instance) {

    var module = instance.point_of_sale;
    module.SynchNotificationWidget = module.SynchNotificationWidget.extend({
        start: function () {
            var self = this;
            var locked = false; // this enforce call only one time push_order method
            this.pos.bind('change:synch', function (pos, synch) {
                self.set_status(synch.state, synch.pending);
            });
            this.$el.on('click', function (e) {
                if (!locked) {
                    locked = true;
                    self.pos.push_order().done(function (ids) {
                        //use ids backend if necessary
                        //ids exists if pos_change_order_name is installed
                        //else undefined
                        //todo: this module needs dependency pos_change_order_name?
                        locked = false;
                    });
                }
            });
        },
    });
}
