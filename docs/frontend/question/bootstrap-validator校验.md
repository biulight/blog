---
sidebar_position: 2
id: 2
---

# bootstrap-valiator 校验

论认真阅读文档的重要性

## 问题情景再现

```html
<input type="text" name="age" placeholder="请输入年龄"  />
```

## 原因分析

需要校验的表单元素需要使用 `form-group` 类包裹

```html
<div class="form-group">
    <input type="text" name="age" placeholder="请输入年龄" />
</div>
```

## 总结

少年，认真阅读文档吧