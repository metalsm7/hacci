const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const Views = require('koa-views');
const consola = require('consola');

//
const app = new Koa();

// view
const render = Views(`${__dirname}/views`, {
    map: {
        html: 'mustache'
    }
});
app.use(render);

// 기본 미들웨어 처리
app.use(bodyParser({
  onerror: (err, _ctx) => {
    consola.error({
        message: `parser - err:${err}`,
        badge: true,
    });
  }
}));

//
const router = new Router();
router.get('/', async (ctx) => {
    await ctx.render('index', { target: 'Koa' });
});

app.use(router.routes());

// 오류 내부 처리
app.on('error', async (err, _ctx) => {
    consola.error({
        message: `error - err:${err}`,
        badge: true,
    });
});

/**
 * @summary 서비스 시작점
 * @param {StartOption} option 
 */
const start = () => {
  //console.log(`index - Opt:${JSON.stringify(Opt)}`);
  //
  app.listen(3000, () => {
    consola.info({
      message: ` Server listening on 3000 `,
      badge: true,
    });
    //console.log(chalk.green(`Server listening on 3000 in ${Env.raw} mode`));
  });
};
start();