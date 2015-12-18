/**
 * Created by Ssoele on 26/11/2015.
 */
var kassa = {
    api: "",
    uid: "",
    secret: "",
    run: (function() {
        var categories;
        var tmpProduct;

        $('#products').on('scroll', scrollHandler);
        $('#products').css('height', ($(window).height()-50));
        $('.order-list').css('height', ($(window).height()-200));
        $('.scroll').css('height', ($(window).height()-50));
        $(window).resize(function() {
            $('#products').css('height', ($(window).height()-50));
            $('.order-list').css('height', ($(window).height()-200));
            $('.scroll').css('height', ($(window).height()-50));
            $('#scroll-products .scroll-bar').css('top', (($('#products').scrollTop()/($('#products')[0].scrollHeight-$('#products').height()))*($('#scroll-products').height()-240))+80);
            $('#scroll-products .scroll-bar').draggable({
                axis: "y",
                containment: [15, 130, 15, ($(window).height()-160)]
            });
            updateScroll();
        });
        $('#scroll-products .scroll-bar').draggable({
            axis: "y",
            containment: [15, 130, 15, ($(window).height()-160)]
        });

        $('#scroll-products .scroll-bar').on('mousedown', function() {
            $('#products').off('scroll', scrollHandler);
        });
        $(document).on('mouseup', function() {
            $('#products').on('scroll', scrollHandler);
        });

        $('#scroll-products .scroll-bar').on('drag', function() {
            var scrollBarTop = $('#scroll-products .scroll-bar').css('top').slice(0, -2)-80;
            var scrollHeight = ($('#scroll-products').height()-240);
            var categoriesScrollable = $('#products')[0].scrollHeight-$('#products').height();
            $('#products').scrollTop((scrollBarTop/scrollHeight)*categoriesScrollable);
        });

        $('#scroll-products .scroll-up').on('click', function() {
            $('#products').scrollTop($('#products').scrollTop()-100);
        });

        $('#scroll-products .scroll-down').on('click', function() {
            $('#products').scrollTop($('#products').scrollTop()+100);
        });

        updateTotal();

        $('#categories').on('click', 'h3', function() {
            $('#products .row').hide();
            $('#categories h3').removeClass('active');
            $(this).addClass('active');
            $('#row-category-'+$(this).data('category')).show();
            updateImages();
            updateScroll();
        });



        $('#products').on('click', '.product', function() {
            var product = getProductById($(this).data('product-id'));
            if(product.categories_id_sub == null) {
                addProduct(product);
            } else {
                tmpProduct = product;
                var subcategory = getCategoryById(product.categories_id_sub);
                $('#categories').addClass('blurable');
                $('#products').addClass('blurable');
                $('#product-overlay').show();
                $('#subcategories').append('<h3 id="h3-subcategory-'+subcategory.id+'" data-category="'+subcategory.id+'" class="active">'+subcategory.name+'</h3>');
                $('#subproducts').append('<div class="row" id="row-subcategory-'+subcategory.id+'" data-category="'+subcategory.id+'"></h3>');
                subcategory.products.forEach(function(subproduct) {
                    if(subproduct.visible) {
                        $('#row-subcategory-'+subcategory.id).append('<div class="col-lg-2 col-md-3 col-sm-3"><div class="thumbnail product" data-product-id="'+subproduct.id+'"><img src="'+subproduct.image+'" alt="'+subproduct.name+'"><div class="caption"><p class="product-info"><span class="product-name">'+subproduct.name+'</span><span class="product-price-plus">'+subproduct.price+'</span></p></div></div></div>');
                    }
                });
            }
        });
        $('#subproducts').on('click', '.product', function() {
            var product = tmpProduct;
            tmpProduct = null;
            var subproduct = getProductById($(this).data('product-id'));
            addProductWithSub(product, subproduct);
            $('#subcategories').empty();
            $('#subproducts').empty();
            $('.blurable').removeClass('blurable');
            $('#product-overlay').hide();
        });
        $('.order-list').on('click', '.product-cancel', function() {
            $(this).parent().remove();
            updateTotal();
        });

        $('.order-place').click(function() {
            if($('.order-list li').length > 0) {
                var products = {
                    products: []
                };
                $('.order-list li').each(function() {
                    var product = {};

                    product.id = $(this).data('product');
                    product.amount = $(this).data('amount');
                    if(isNumeric($(this).data('subproduct'))) {
                        product.sub = $(this).data('subproduct');
                    }

                    products.products.push(product);
                });

                $.post(kassa.api+'orders/create', {
                    uid: kassa.uid,
                    secret: kassa.secret,
                    products: JSON.stringify(products)
                }).done(function(data) {
                    $('#main-overlay .panel-body').empty().append('<div class="order-response"><h3 class="order-header">Your order number</h3><h1 class="order-nr">'+data.order+'</h1><button type="button" class="btn btn-danger btn-lg order-next">Next order</button></div>');

                    $('#main').addClass('blurable');
                    $('#main-overlay').show();
                }).fail(function(data) {
                    console.log('order failed')
                });
            }
        });

        $('#main-overlay').on('click', '.order-next', function() {
            console.log('9');
            $('.order-list').empty();
            $('#main').removeClass('blurable');
            $('#main-overlay').hide();
            updateTotal();
        });

        $('.order-reset').click(function() {
            $('.order-list').empty();
            updateTotal();
        });

        $.post(kassa.api+'products/get', {uid: kassa.uid, secret: kassa.secret}).done(function(data) {
            categories = data;
            $('#categories').empty();
            $('.order-list').empty();
            categories.forEach(function(category) {
                $('#categories').append('<h3 id="h3-category-'+category.id+'" data-category="'+category.id+'">'+category.name+'</h3>');
                if(category.visible) {
                    $('#h3-category-'+category.id).show();
                } else {
                    $('#h3-category-'+category.id).hide();
                }
                $('#products').append('<div class="row" id="row-category-'+category.id+'" data-category="'+category.id+'"></h3>');
                category.products.forEach(function(product) {
                    $('#row-category-'+category.id).append('<div class="col-lg-2 col-md-3 col-sm-3" id="products-'+product.id+'"><div class="thumbnail product" data-product-id="'+product.id+'"><img src="'+product.image+'" alt="'+product.name+'"><div class="caption"><p class="product-info"><span class="product-name">'+product.name+'</span><span class="product-price">'+product.price+'</span></p></div></div></div>');
                    if(product.visible) {
                        $('#products-'+product.id).show();
                    } else {
                        $('#products-'+product.id).hide();
                    }
                });
            });
            $('#products .row').first().show();
            $('#categories h3').first().addClass('active');
            updateImages();
            updateScroll();
        });

        setInterval(function() {
            $.post(kassa.api+'products/get', {uid: kassa.uid, secret: kassa.secret}).done(function(data) {
                categories = data;
                categories.forEach(function(category) {
                    if(category.visible) {
                        $('#h3-category-'+category.id).show();
                    } else {
                        $('#h3-category-'+category.id).hide();
                    }
                    category.products.forEach(function(product) {
                        if(product.visible) {
                            $('#products-'+product.id).show();
                        } else {
                            $('#products-'+product.id).hide();
                        }
                    });
                });
                updateScroll();
            });
        }, 5000);

        function getProductById(id) {
            var returnVar;
            categories.forEach(function(category) {
                category.products.forEach(function(product) {
                    if(product.id == id) {
                        returnVar = product;
                    }
                });
            });
            return returnVar;
        }

        function getCategoryById(id) {
            var returnVar;
            categories.forEach(function(category) {
                if(category.id == id) {
                    returnVar = category;
                }
            });
            return returnVar;
        }

        function addProduct(product) {
            var id = '#order-product-'+product.id;
            if($(id).length) {
                var amount  = $(id).data('amount')+1;
                var price   = amount * product.price;

                $(id).data('amount', amount);
                $(id).data('price', price);
                $(id).data('product', product.id);
                $(id+' .product-amount').text(amount);
                $(id+' .product-price').text(price.toFixed(2));
            } else {
                var amount  = 1;
                var price   = product.price;

                $('.order-list').append('<li class="product" id="order-product-'+product.id+'"></li>');

                $(id).append('<span class="product-amount">'+amount+'</span>');
                $(id).append('<span class="product-name">'+product.name+'</span>');
                $(id).append('<span class="product-cancel"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span>');
                $(id).append('<span class="product-price">'+price.toFixed(2)+'</span>');
                $(id).append('<span class="product-clear"></span>');

                $(id).data('amount', amount);
                $(id).data('price', price);
                $(id).data('product', product.id);
            }
            updateTotal();
        }

        function addProductWithSub(product, subproduct) {
            var id = '#order-product-'+product.id+'-sub-'+subproduct.id;
            if($(id).length) {
                var amount  = $(id).data('amount')+1;
                var price   = amount * (product.price + subproduct.price);

                $(id).data('amount', amount);
                $(id).data('price', price);
                $(id).data('product', product.id);
                $(id).data('subproduct', subproduct.id);
                $(id+' .product-amount').text(amount);
                $(id+' .product-price').text(price.toFixed(2));
            } else {
                var amount  = 1;
                var price   = product.price + subproduct.price;

                $('.order-list').append('<li class="product" id="order-product-'+product.id+'-sub-'+subproduct.id+'"></li>');

                $(id).append('<span class="product-amount">'+amount+'</span>');
                $(id).append('<span class="product-name">'+product.name+'</span>');
                $(id).append('<span class="product-cancel"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span>');
                $(id).append('<span class="product-price">'+price.toFixed(2)+'</span>');
                $(id).append('<span class="product-sub">'+subproduct.name+'</span>');
                $(id).append('<span class="product-clear"></span>');

                $(id).data('amount', amount);
                $(id).data('price', price);
                $(id).data('product', product.id);
                $(id).data('subproduct', subproduct.id);
            }
            updateTotal();
        }

        function updateTotal() {
            var total = 0;
            $('.order-list li').each(function() {
               total += $(this).data('price');
            });
            $('.total-price').text(total.toFixed(2));
        }

        function isEmpty(input) {
            if(!isNaN(input) && input) {
                return false;
            } else {
                return true;
            }
        };

        function scrollHandler() {
            $('#scroll-products .scroll-bar').css('top', (($(this).scrollTop()/($(this)[0].scrollHeight-$(this).height()))*($('#scroll-products').height()-240))+80);
        }

        function updateScroll() {
            if($('#products').height() < ($('#products')[0].scrollHeight-20)) {
                $('#scroll-products').show();
            } else {
                $('#scroll-products').hide();
            }
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function updateImages() {
            $('.thumbnail img').each(function() {
                $(this).css('width', '100%')
                $(this).css('height', $(this).css('width'));
                console.log('1');
            });
        }
    }),
    setup: (function() {
        $(document).ready(function() {
            if(!localStorage.kassa) {
                $('#main').addClass('blurable');
                $('#main-overlay').show();
            } else {
                var setup = JSON.parse(localStorage.kassa);
                kassa.api = setup.api;
                kassa.uid = setup.uid;
                kassa.secret = setup.secret;
                kassa.run();
            }

            $('.setup-submit').click(function() {
                $('.setup-error').remove();
                kassa.api = $('#setup-api').val();
                kassa.uid = $('#setup-uid').val();
                kassa.secret = $('#setup-secret').val();
                $.post(kassa.api+'check', {uid: kassa.uid, secret: kassa.secret}, function(data) {
                    if(data.success) {
                        localStorage.kassa = JSON.stringify({
                            api: kassa.api,
                            uid: kassa.uid,
                            secret: kassa.secret
                        });
                        $('#main').removeClass('blurable');
                        $('#main-overlay').hide();
                        kassa.run();
                    } else {
                        $('#main-overlay .panel-body').prepend('<div class="alert alert-danger setup-error" role="alert">Login failed!</div>');
                    }
                }).fail(function () {
                    $('#main-overlay .panel-body').prepend('<div class="alert alert-danger setup-error" role="alert">Login failed!</div>');
                });
            });
        });
    })
};
kassa.setup();