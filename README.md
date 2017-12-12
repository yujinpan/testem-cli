 - Build Your Own Angularjs

### $watch & $digest

 - Angular的脏检查的两面过程：$watch和$digest。
 - 脏检查回路(当最后的watch干净时提前结束digest)，TTL机制将其短路($digest超过10次，抛出错误)。
 - 基于参考的和基于值的比较之前的区别（Object,NaN）。
 - 以不同的方式在digest循环中执行函数：立即使用$eval。
 - $apply和$evalAsync，$applyAsync和$$postDigest。
 - Angular $digest中异常处理。
 - 销毁watch，时期不会再执行。
 - 使用$watchGroup函数观察单个效果的几件事。

### Scope Tree

 - 如何创建子作用域。（child = Object.create(this)）
 - 范围继承与JavaScript原生原型链继承之间的关系。
 - 属性阴影及其影响。（Array和Object在上下作用域之间是共享的）
 - 从父级作用域到其子集作用域的递归digest。（递归树结构）
 - digest中$digest,$apply的区别。（$digest执行当前作用域的，$apply全局执行digest）
 - 隔离的作用域及他们与正常作用域的区别。（隔离的为 new Scope(),但是共享异步队列$evalAsync,$applyAsync,$$postDigest）
 - 如何销毁子集作用域。（将parent.$$children中当前scope删除，将当前scope的$$children删除，对象没有引用，内存回收）

### $watchCollection

 - 区分数组，对象与其他值，处理非集合。（交给$watch处理）
 - 处理数组，类数组。（1.判断旧值是否是类数组，区分有length属性的类数组对象，赋值空数组；2.判断length是否相等，使length相等；3.遍历数组每一项是否相等，使之相等；）
 - 处理对象，类数组对象。（1.声明newLength,oldLength记录新值与旧值的属性数量；2.判断是否是对象或类数组对象，赋值空对象；2.遍历对象，没有的加上新属性，有的更新新属性；3.判断新旧对象数量oldValue是否有废弃的旧值，有则遍历去掉旧值；）