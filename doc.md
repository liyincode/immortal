# 不朽 Immortal

一款基于 `Web3` + `AI` 的答题擂台，风格类似于拳击比赛，用户可以进行答题，也可以为选手加油鼓掌，选手答题错误可以被观众替换上台答题。

## 整体思路

~~这个擂台是**每一小时举办一次**~~。

首先，当用户打开这个网页时，如果比赛还未开始，~~页面中间有一个巨大的比赛倒计时效果~~，用户可以选择：
- **我要战斗** - 说明用户想要进行擂台比赛，用户进入候选池
- **我要加油** - 用户在擂台下可以找个位置坐下，类似演唱会选座位

当比赛还有十分钟就要开始时，系统开始随机从候选池中选出决战双方，这里会有探照灯左右徘徊最后居中在两位选手头上的效果。

选定比赛双方之后，落选的进入观众席，观众席有座位，座位有编号，观众可以选座位，座位有热力值，热力值越高，观众头上会有一个热力值的图标，热力值图标会随着观众加油鼓掌而增加。

然后比赛正式开始，每次有十道题，全部有 `AI` 机器人出题，由 `AI` 机器人判断是否对错，这里 `AI` 机器人就是裁判，类似铁甲小宝中蜻蜓队长的角色（这里念题目和选出冠军的语言都可以使用蜻蜓队长的语音），这里的 `AI` 机器人的形态要明显放在页面中。

每次的题目是选择题，有四个选项，选手每次开始答题，超时未选择判这道题输，总共答十个题目。

台下观众可以鼓掌加油（观众页面有加油按钮），观众头像会有一个热力值，如果加油鼓掌次数越多，观众头上的热力值就会越高，这里的效果大概是观众头会越红，上面有团小火越来越旺。

如果台上其中一名选手连续答错 3 题，观众热力值最高的就可以上去替代这个选手。这里的效果是擂台上选手脚下有个黑洞掉了下去。当台上选手掉下去后，观众页面会有一个选项，在热力度最高的选手页面，选择上台还是继续鼓掌，如果选择上台就上去答题，如果继续加油就选择下一位热力值最高进行选择上台和加油。

当观众变成选手后继续答题。

当答题结束后，机器人选择获胜选手是谁。然后这里最重要的就是有一个全屏特效，拿出一个正方体区块，将选手姓名及观众姓名凿刻到这个区块中，然后区块嵌入不朽链中，就相当于区块链中添加一个区块的意思。然后猛的一声将区块砸进不朽链中，意思就是这个成绩会永远添加到不朽链中。

> 区块链的特点就是永远存在并不会被篡改，这就是不朽链的意思。你的成绩永远不朽

## 页面布局

整个页面的布局包含以下几个部分：

**顶部区域**：一个上下晃动的不朽链，一个区块连着一个区块的效果，用户可以点击区块看到过往比赛的胜利者

**中间区域**：一个擂台的效果
- 擂台最顶是机器人裁判
- 擂台两边是答题者
- 擂台中间是题目和选项

**底部区域**：观众席，类似演唱会选座位的样式
- 如果有用户选择了座位就将用户 `ENS Name` 显示，或者公钥缩写
- 头像的话有的话就用用户的，没有的话就随机一个

## 页面设计
- 整体风格为蒸汽波和赛博朋克风格

## Web3 相关

首先这上面的逻辑都要**入链**：

1. 每次比赛的题目和答案
2. 每次比赛谁获胜了
3. 不朽链记录
4. 每次比赛用户的加油鼓掌声

## 产品目的

- **普及 Web3**：让普通人进入 `Web3`，答题擂台这种模式更让普通人理解参与，而且比较正能量
- **突出区块链特性**：不朽链的想法突出区块链的特点告诉用户你的荣耀永远存在
- **营造宏大氛围**：想要一种宏大的宿命对决的感觉，就像古罗马对决一样，虽然是答题但很神圣
- **提高参与度**：观众通过加油鼓掌提高参与度，而且能替换台上选手，增加游戏的刺激感


