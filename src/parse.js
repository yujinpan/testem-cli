/* jshint globalstrict: true */
'use strict';

/**
 * The expression parsing pipeline 表达式解析管道
 * "a + b" => 
 * (Lexer语法分析器) => 
 * (Tokens令牌)[
 *     {text: 'a', identifier: true},
 *     {text: '+'},
 *     {text: 'b', identifier: true}
 * ] => 
 * (AST Builder) =>
 * (Abstract Syntax Tree 抽象语法树){
 *     type: AST.binaryExpression,
 *     operator: '+',
 *     left: {
 *         type: AST.Identifier,
 *         name: 'a'
 *     },
 *     left: {
 *         type: AST.Identifier,
 *         name: 'b'
 *     }
 * } => 
 * (AST Compiler) =>
 * (Expression Function)(
 *     function(scope){ return scope.a + scope.b; }
 * )
 * 
 * Lexer => AST Build => AST Compile
 */

function parse(expr) {
    var lexer = new Lexer();
    var parse = new Parser(lexer);
    return parse.parse(expr);
    // return ...
}

// Lexer 解析器
function Lexer() {

}
Lexer.prototype.lex = function (text) {
    this.text = text;
    this.index = 0;
    this.ch = undefined;
    this.tokens = [];

    while (this.index < this.text.length) {
        this.ch = this.text.charAt(this.index);
        if (this.isNumber(this.ch) ||
            (this.ch === '.' && this.isNumber(this.peek()))) {
            this.readNumber();
        } else if (this.ch === '\'' || this.ch === '"') {
            this.readString(this.ch);
        } else if (this.isIdent(this.ch)) {
            // a-z A-Z _ $
            this.readIdent();
        } else if (this.isWhitespace(this.ch)) {
            // 遇到空格字符，将当前指针向前移动
            this.index ++;
        } else {
            throw 'Unexpected next character: ' + this.ch;
        }
    }

    return this.tokens;
    // Tokenization will be done here
};
Lexer.prototype.isNumber = function (ch) {
    return '0' <= ch && ch <= '9';
};
Lexer.prototype.readNumber = function () {
    var number = '';
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index).toLowerCase();
        if (ch === '.' || this.isNumber(ch)) {
            number += ch;
        } else {
            var nextch = this.peek();
            var prevch = number.charAt(number.length - 1);
            // 如果当前字符为e，下一个字符为有效的指数运算符
            if (ch === 'e' && this.isExpOperator(this.peek())) {
                number += ch;
                // 如果当前字符为+或-，前一个字符为e，下一个字符为数字
            } else if (this.isExpOperator(ch) && prevch === 'e' &&
                nextch && this.isNumber(nextch)) {
                number += ch;
                // 如果当前字符为+或-，前一个字符为e，没有下一个数字
            } else if (this.isExpOperator(ch) && prevch === 'e' &&
                (!nextch || !this.isNumber(nextch))) {
                throw "Invalid exponent";
            } else {
                break;
            }
        }
        this.index++;
    }
    this.tokens.push({
        text: number,
        value: Number(number)
    });
};
Lexer.prototype.peek = function () {
    return this.index < this.text.length - 1 ?
        this.text.charAt(this.index + 1) :
        false;
};
Lexer.prototype.isExpOperator = function (ch) {
    return ch === '+' || ch === '-' || this.isNumber(ch);
};
// 换行符\n, 换行符\f, 回车符\r, 水平制表符\t, 垂直制表符\v
// Unicode转义序列，以\u开头并包含四位十六进制。
// 例如，\u00A0表示一个不间断的空格字符。
var ESCAPE = {
    'n': '\n', 'f': '\f', 'r': '\r', 't': '\t',
    'v': '\v', '\'': '\'', '"': '"'
};
Lexer.prototype.readString = function (quote) {
    this.index++;
    var string = '';
    var escape = false;
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index);
        if (escape) {
            if (ch === 'u') {
                var hex = this.text.substring(this.index + 1, this.index + 5);
                if (!hex.match(/[\da-f]{4}/i)) {
                    throw "Invalid unicode escape";
                }
                this.index += 4;
                string += String.fromCharCode(parseInt(hex, 16));
            } else {
                var replacement = ESCAPE[ch];
                if (replacement) {
                    string += replacement;
                } else {
                    string += ch;
                }
            }
            escape = false;
        } else if (ch === quote) {
            this.index++;
            this.tokens.push({
                text: string,
                value: string
            });
            return;
        } else if (ch === '\\') {
            escape = true;
        } else {
            string += ch;
        }
        this.index++;
    }
    throw 'Unmatched quote';
};
// 通过查看是否有一个小写或大写字母，下划线或美元字符开头的序列来表示语法分析器的标识符
Lexer.prototype.isIdent = function (ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'z') ||
        ch === '_' || ch === '$';
};
// 读取标识符
Lexer.prototype.readIdent = function () {
    var text = '';
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index);
        // 是标识符和数字
        if (this.isIdent(ch) || this.isNumber(ch)) {
            text += ch;
        } else {
            break;
        }
        this.index++;
    }
    var token = { text: text };
    this.tokens.push(token);
};
// 空格，回车，水平制表符，垂直制表符，换行符，非空格符
Lexer.prototype.isWhitespace = function(ch) {
    return ch === ' ' || ch === 'r' || ch === '\t' ||
           ch === '\n'|| ch === '\v'|| ch === '\u00A0';
};

// AST Abstract Syntax Tree 抽象语法树
function AST(lexer) {
    this.lexer = lexer;
}
AST.Program = 'Program';
AST.Literal = 'Literal';
AST.prototype.ast = function (text) {
    this.tokens = this.lexer.lex(text);
    return this.program();
    // AST building will be done here
};
AST.prototype.program = function () {
    return { type: AST.Program, body: this.primary() };
};
AST.prototype.primary = function () {
    if (this.constants.hasOwnProperty(this.tokens[0].text)) {
        return this.constants[this.tokens[0].text];
    } else {
        return this.constant();
    }
};
AST.prototype.constant = function () {
    return { type: AST.Literal, value: this.tokens[0].value };
};
AST.prototype.constants = {
    'null': { type: AST.Literal, value: null },
    'true': { type: AST.Literal, value: true },
    'false': { type: AST.Literal, value: false }
};

// ASTCompiler
function ASTCompiler(astBuilder) {
    this.astBuilder = astBuilder;
}
ASTCompiler.prototype.compile = function (text) {
    var ast = this.astBuilder.ast(text);
    this.state = { body: [] };
    this.recurse(ast);
    // 这里取消jshint的报错（W054）
    /* jshint -W054 */
    return new Function(this.state.body.join(''));
    /* jshint +W054 */
    // AST compilation will be done here
};
ASTCompiler.prototype.recurse = function (ast) {
    switch (ast.type) {
        case AST.Program:
            this.state.body.push('return ', this.recurse(ast.body), ';');
            break;
        case AST.Literal:
            return this.escape(ast.value);
    }
};
// 匹配所有除字母数字之外的字符
ASTCompiler.prototype.stringEscapeRegex = /[^a-zA-Z0-9]/g;
ASTCompiler.prototype.stringEscapeFn = function (c) {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
};
// 格式为字符串
ASTCompiler.prototype.escape = function (value) {
    if (_.isString(value)) {
        return '\'' +
            value.replace(this.stringEscapeRegex, this.stringEscapeFn) +
            '\'';
    } else if(_.isNull(value)) {
        return 'null';
    } else {
        return value;
    }
};

// Parser
function Parser(lexer) {
    this.lexer = lexer;
    this.ast = new AST(this.lexer);
    this.astCompiler = new ASTCompiler(this.ast);
}
Parser.prototype.parse = function (text) {
    return this.astCompiler.compile(text);
};
