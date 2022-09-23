function test() {
    console.log(arguments.callee.name);
}

test();