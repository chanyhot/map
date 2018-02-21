/*global ko, Router */
(function() {
    'use strict';
    // 全局
    var infoWindow;
    var map;
    var xhr;
    var ENTER_KEY = 13;
    var url = 'https://zh.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=pageimages|extracts&pilimit=max&exintro&explaintext&exsentences=1&exlimit=max&origin=*&gsrsearch=';
    var loadingHTML = '<div class="fa fa-spin fa-spinner"></div>';

    // model
    var data = [{
        name: '东方明珠',
        search: '上海东方明珠',
        pageId: 45254,
        marker: new AMap.Marker({
            position: [121.499809, 31.239666],
            title: '东方明珠',
            animation: 'AMAP_ANIMATION_DROP'
        })
    }, {
        name: '人民广场',
        search: '上海人民广场',
        pageId: 253587,
        marker: new AMap.Marker({
            position: [121.475190, 31.228833],
            title: '人民广场',
            animation: 'AMAP_ANIMATION_DROP'
        })
    }, {
        name: '上海火车站',
        search: '上海火车站',
        pageId: 678047,
        marker: new AMap.Marker({
            position: [121.455536, 31.249452],
            title: '上海火车站',
            animation: 'AMAP_ANIMATION_DROP'
        })
    }, {
        name: '城隍庙',
        search: '上海城隍庙',
        pageId: 501016,
        marker: new AMap.Marker({
            position: [121.492512, 31.225722],
            title: '城隍庙',
            animation: 'AMAP_ANIMATION_DROP'
        })
    }, {
        name: '恒隆广场',
        search: '上海恒隆广场',
        pageId: 413518,
        marker: new AMap.Marker({
            position: [121.453507, 31.227852],
            title: '恒隆广场',
            animation: 'AMAP_ANIMATION_DROP'
        })
    }];


    // viewModel
    var ViewModel = function(list) {
    	// hack
        var self = this;

        // 设置observe
        this.current = ko.observable('');
        this.btnName = ko.observable('Reset');
        this.markerList = ko.observableArray(list);

        // 输入框为空或非空时切换按钮文字
        this.setBtnName = function() {
            if (this.current() === '') {
                this.btnName('Reset');
            } else {
                this.btnName('Filter');
            }
            return true;
        }

        // 根据输入框文字筛选
        this.filter = function() {
        	// 关闭信息窗口
            infoWindow.close();
            // 输入框输入的文字
            var current = this.current().trim();
            // 如果输入框有值，则按文字筛选，如为空，则重置所有地图点
            if (current) {
                var array = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].name.indexOf(current) !== -1) {
                        array.push(list[i]);
                        list[i].marker.show();
                        list[i].marker.setAnimation('AMAP_ANIMATION_DROP');
                    } else {
                        list[i].marker.hide();
                    }
                }
                self.markerList(array);
            } else {
                for (var i = 0; i < list.length; i++) {
                    list[i].marker.show();
                    list[i].marker.setAnimation('AMAP_ANIMATION_DROP');
                }
                self.markerList(list);
            }
        }

        // 列表按钮点击事件
        this.buttonClicked = function() {
            getInfoContent(this.marker);
        }
    };

    // 焦点在输入框时按回车键
    function keyhandlerBindingFactory(keyCode) {
        return {
            init: function(element, valueAccessor, allBindingsAccessor, data, bindingContext) {
                var wrappedHandler, newValueAccessor;
                wrappedHandler = function(data, event) {
                    if (event.keyCode === keyCode) {
                        valueAccessor().call(this, data, event);
                    }
                };
                newValueAccessor = function() {
                    return {
                        keyup: wrappedHandler
                    };
                };
                ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, bindingContext);
            }
        };
    }
    ko.bindingHandlers.enterKey = keyhandlerBindingFactory(ENTER_KEY);

    // 根据model数组索引，获取wiki api的数据
    function getDataFromWiki(index) {
        xhr = $.ajax({
            url: url + data[index].search,
            type: 'GET',
            timeout: 300000,
            success: function(res) {
                var page = res.query.pages[data[index].pageId];
                var extract = page.extract;
                var imgsrc = '';
                try {
                    imgsrc = page.thumbnail.source;
                } catch (e) {}
                var listcontent = '';
                if (imgsrc) {
                    listcontent = '<img src="' + imgsrc + '">';
                }
                listcontent += extract;
                data[index].content = listcontent;
                infoWindow.setContent(listcontent);
            },
            error: function(e) {
            	if (e.statusText !== 'abort') {
            		alert('从WIKI获取数据发生错误!')
            	}
            }
        });
    }

    // 如果model中有content数据，则直接读取显示，如果没有，则通过wiki api获取数据再显示
    function getInfoContent(marker) {
    	// 如果有ajax请求数据，则中断请求
    	if (xhr) {
    		xhr.abort();
    	}
    	// 设置loading图标
    	infoWindow.setContent(loadingHTML);
        if (data[marker.index].content) {
            infoWindow.setContent(data[marker.index].content);
        } else {
            getDataFromWiki(marker.index);
        }
        infoWindow.open(map, marker.getPosition());
        marker.setAnimation('AMAP_ANIMATION_DROP');
    }

    // 地图标记点击事件
    function markerClick(e) {
        getInfoContent(e.target);
    }

    // 页面初始化
    function init() {
        map = new AMap.Map('container', {
            resizeEnable: true,
            zoom: 13,
            center: [121.473701, 31.230416]
        });

        infoWindow = new AMap.InfoWindow({
            offset: new AMap.Pixel(12, -25)
        });

        for (var i = 0; i < data.length; i++) {
            data[i].marker.setMap(map);
            data[i].marker.index = i;
            data[i].marker.on('click', markerClick);
        }

        AMap.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.OverView'],
            function() {
                map.addControl(new AMap.ToolBar());

                map.addControl(new AMap.Scale());
            });

        var viewModel = new ViewModel(data);
        ko.applyBindings(viewModel);
    }

    window.onload = function() {
        init();
    }

}());