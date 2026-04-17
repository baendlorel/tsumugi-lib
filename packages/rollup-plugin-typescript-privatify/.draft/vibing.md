rollup-plugin-typescript-privatify看这个子包。请你开发：

1. 这其实是@rollup/plugin-typescript的plugin，也就是插件的插件。
2. 请你找出一个class中标记为private的函数也好属性值也好，将其修改为真正的私有属性；
3. 将`class A`的private的属性改为真正私有属性的模式有（这两个模式将在插件options里可配置）:
   - 使用#前缀的私有字段（ECMAScript私有字段）
   - 在旁边增加一个`class A__private`，其上的方法为`A`上私有方法。使用weakmap，将this和一个`class A__private`的实例关联起来，私有对象中放上私有属性和方法，在A里用到private的方法的时候，则通过call来绑定真正的this
4. 至于ts用什么解析器，随你选择
