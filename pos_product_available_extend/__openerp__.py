{
    'name': 'Product Available Extend in POS',
    'version': '1.0',
    'author': 'IT-Projects LLC, Ivan Yelizariev, Juan Carlos Montoya',
    'category': 'Point Of Sale',
    'website': 'http://sdi.es',
    'depends': [
        'pos_product_template',
        'pos_pricelist',
        'point_of_sale',
    ],
    'data': [
        'templates.xml',
    ],
    'qweb': [
        'static/src/xml/pos_product_available_extend.xml',
    ],
    'installable': True,
}
