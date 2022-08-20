---
sidebar_position: 1
id: 1
---

# ES5和ES6变量声明的差异

顽固不化的 `var` 和 `function`

## 问题情景再现

```javascript
// 1. let/const 声明的变量不挂载在windows上
let c = 'hello world';
console.log(window.c); // undefined

// 2. this指向
let len = 10;
function fn() {
    return this.len;
}
fn(); // undefined

// 3. arguments对象调用fn方法
const person = {
    len: 5,
    say: function() {
        fn(); // undefined
        arguments.len = 20;
        arguments[0](); // 20
    }
}
person.say(fn); 
```

## 原因分析

1. `ES5` 中，顶层对象的属性等价于全局变量。
2. `ES6` 中，有所改变
    - `var`、`function` 声明的全局变量，依然是顶层对象的属性；
    - `let`、`const`、`class` 声明的全局变量不属于顶层对象的属性；
3. `let` 和 `const` 声明的变量存在于`Scope`作用域链上的名为`Script`的作用域中，不挂载在`window`对象上

## 总结

1. 都2019年了，放弃使用 `var` 吧