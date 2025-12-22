// ==UserScript==
// @name         评教一键选择按钮
// @namespace    https://github.com/joonokon
// @version      1.0.0
// @description  为评教页面添加一键选择按钮
// @author       joonokon
// @match        https://pj.*.edu.cn/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 判断当前脚本是否运行在iframe中
    function inIframe () {
        try { return window.self !== window.top; } catch (e) { return true; }
    }

    /**
     * 在页面中插入一键选择按钮
     * @param {Document} doc - 目标文档对象
     */
    function addButtons(doc) {
        // 先找h4.lighter作为插入点
        var h4 = doc.querySelector('h4.lighter');
        // 若找不到，找包含“课程评价”的h4或label
        if (!h4) {
            h4 = Array.from(doc.querySelectorAll('h4,label')).find(e => e.textContent && e.textContent.indexOf('课程评价') !== -1);
        }
        // 未找到插入点则返回
        if (!h4) return;
        // 已插入过则不重复插入
        if (doc.getElementById('pjx-btn-bar')) return;
        // 创建按钮容器
        var btnBar = doc.createElement('div');
        btnBar.id = 'pjx-btn-bar';
        btnBar.style.margin = '15px 0';
        // 定义5个按钮及其样式
        var btns = [
            {text: '一键非常符合', idx: 1, color: '#5cb85c'},
            {text: '一键比较符合', idx: 2, color: '#0275d8'},
            {text: '一键一般', idx: 3, color: '#5bc0de'},
            {text: '一键比较不符合', idx: 4, color: '#f0ad4e'},
            {text: '一键非常不符合', idx: 5, color: '#d9534f'}
        ];
        // 生成按钮并绑定点击事件
        btns.forEach(function(btn) {
            var b = doc.createElement('button');
            b.type = 'button';
            b.textContent = btn.text;
            b.style.marginRight = '5px';
            b.style.background = btn.color;
            b.style.color = '#fff';
            b.style.border = 'none';
            b.style.padding = '6px 12px';
            b.style.borderRadius = '4px';
            b.style.cursor = 'pointer';
            // 点击按钮时，批量选择所有题目的对应选项
            b.onclick = function() { selectAllOption(doc, btn.idx); };
            btnBar.appendChild(b);
        });
        // 插入到标题后面
        h4.parentNode.insertBefore(btnBar, h4.nextSibling);
    }

    /**
     * 批量选择所有题目的第n个选项
     * @param {Document} doc - 目标文档对象
     * @param {number} n - 选择第n个选项（1-5）
     */
    function selectAllOption(doc, n) {
        var i = 1;
        while (true) {
            // 依次查找 name=pjnr_1, pjnr_2 ... 的单选框组
            var radios = doc.getElementsByName('pjnr_' + i);
            if (!radios || radios.length === 0) break;
            // 若该题有n个及以上选项，则选中第n个
            if (radios.length >= n) {
                radios[n-1].checked = true;
                // 若有onclick事件则主动触发
                if (typeof radios[n-1].onclick === 'function') {
                    radios[n-1].onclick();
                }
            }
            i++;
        }
    }

    /**
     * 递归进入所有iframe并尝试插入按钮
     * @param {Document} doc - 目标文档对象
     */
    function tryInsertAll(doc) {
        addButtons(doc);
        var iframes = doc.getElementsByTagName('iframe');
        for (var i = 0; i < iframes.length; i++) {
            try {
                var idoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                if (idoc) tryInsertAll(idoc);
            } catch (e) {}
        }
    }

    // 多次尝试，兼容异步加载和iframe嵌套
    for (let t = 0; t < 12; t++) {
        setTimeout(function() {
            tryInsertAll(window.document);
        }, 500 + t * 500);
    }
})();
