// ==UserScript==
// @name         评教一键选择按钮
// @namespace    https://github.com/joonokon
// @version      1.1.0
// @description  为评教页面添加一键选择按钮
// @author       joonokon
// @match        https://pj.bit.edu.cn/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 自动查找并点击提交按钮，并自动确认弹窗
    function autoSubmit(doc) {
        // 优先查找a.btn-warning[onclick*='savePjxx']
        var submitBtn = doc.querySelector('a.btn-warning[onclick*="savePjxx"]');
        // 其次查找常见提交按钮类型和自定义class
        if (!submitBtn) {
            submitBtn = doc.querySelector('button[type="submit"], input[type="submit"], .btn-primary, .btn-success, .submit, [onclick*="submit"], [id*="submit"], .btn-warning[onclick*="savePjxx"]');
        }
        // 兼容部分评教系统用的“提交”文字按钮
        if (!submitBtn) {
            submitBtn = Array.from(doc.querySelectorAll('button,input,a')).find(e => /提交/.test(e.value || e.textContent));
        }
        var submitted = false;
        if (submitBtn) {
            // 优先直接触发onclick
            if (typeof submitBtn.onclick === 'function') {
                submitBtn.onclick();
                submitted = true;
            } else {
                submitBtn.click();
                submitted = true;
            }
        } else if (typeof window.savePjxx === 'function') {
            // 只有找不到按钮时才直接调用 savePjxx
            window.savePjxx('1');
            submitted = true;
        }
        if (submitted) {
            setTimeout(function() {
                var okBtn = doc.querySelector('.bootbox .btn-primary, .modal-footer .btn-primary, .btn[onclick*="ok"], .btn[onclick*="confirm"], .btn-primary');
                if (!okBtn) {
                    okBtn = Array.from(doc.querySelectorAll('button,input,a')).find(e => /确定|确认|OK|Yes/i.test(e.value || e.textContent));
                }
                if (okBtn) okBtn.click();
            }, 300);
        }
    }

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
        // 若找不到，找包含“课程评价”的h4、label、div、span等
        if (!h4) {
            h4 = Array.from(doc.querySelectorAll('h4,label,div,span')).find(e => e.textContent && e.textContent.indexOf('课程评价') !== -1);
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
            {text: '非常符合', idx: 1, color: '#5cb85c'},
            {text: '比较符合', idx: 2, color: '#0275d8'},
            {text: '一般', idx: 3, color: '#5bc0de'},
            {text: '比较不符合', idx: 4, color: '#f0ad4e'},
            {text: '非常不符合', idx: 5, color: '#d9534f'}
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
        // 添加“提交并返回”按钮
        var submitBackBtn = doc.createElement('button');
        submitBackBtn.type = 'button';
        submitBackBtn.textContent = '提交并返回';
        submitBackBtn.style.background = '#e67e22'; // 深橙色
        submitBackBtn.style.color = '#fff';
        submitBackBtn.style.border = 'none';
        submitBackBtn.style.padding = '8px 22px';
        submitBackBtn.style.borderRadius = '4px';
        submitBackBtn.style.cursor = 'pointer';
        submitBackBtn.style.fontWeight = 'bold';
        submitBackBtn.style.fontSize = '16px';
        submitBackBtn.style.boxShadow = '0 2px 8px rgba(230,126,34,0.15)';
        submitBackBtn.style.marginLeft = '32px'; // 与左侧按钮拉开距离
        submitBackBtn.style.float = 'right';
        submitBackBtn.onmouseover = function(){submitBackBtn.style.background='#d35400';};
        submitBackBtn.onmouseout = function(){submitBackBtn.style.background='#e67e22';};
        submitBackBtn.onclick = function() {
            autoSubmit(doc);
            setTimeout(function() {
                if (typeof window.queryBackSy === 'function') {
                    window.queryBackSy();
                }
            }, 800);
        };
        btnBar.appendChild(submitBackBtn);
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
