const puppeteer = require('puppeteer');
const readline = require("readline");
const Jimp = require('jimp');
const fs = require("fs");
const colors = require('colors');

var DTF_parse = async function (page){
    await page.waitForSelector(".feed__chunk:last-child");
    const _length = await page.evaluate(async () => {
        return await new Promise(resolve =>{
            const items = document.getElementsByClassName("feed__item");

            document.querySelector('.feed__chunk:last-child')
                .scrollIntoView({ block: 'end', inline: 'end' });  

            resolve(items.length);
        })
    });
    await page.waitForSelector(".andropov_image");
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dimensions = await page.evaluate((len) => {
      const items = document.getElementsByClassName("feed__item");
      var to_return = [];
      for (let i = 0; i < len; i++) {
          var e = items[i]; 
         
          var img = e.getElementsByTagName("img");
          
          if(img.length !== 0 && typeof img[0] !== 'undefined'){
              console.log(img[0].src);
              img = img[0].src;
              const reg = /(.*)(-\/preview\/|)/gm;
              if(reg.exec(img)[1] != null)
                img = reg.exec(img)[1];
          } else { 
              img = e.getElementsByClassName("andropov_video__dummy");
              if(img.length !== 0 && typeof img[0] !== 'undefined'){
                  var reg = /url\(\"(.*)\"\)/gm;
                  if(reg.exec(img[0]) != null){
                    img = reg.exec(img[0].style.backgroundImage)[1];
                  }
              }
              else img = "";
          }

          var title = e.getElementsByClassName("content-title");
  
          if(title.length !== 0 && typeof title[0] !== 'undefined')
              title = title[0].innerText;
          else title = "";
  
          if(title !== "" & img !== "")
            to_return.push({ 
                title: title,
                img: img
            });
      
      };
      return to_return 
    }, _length);

    return dimensions;
}

var yaplakal_parse = async function(page){
    await page.waitForSelector("#lentaFeed");
    let result = await page.evaluate(async () => {
        const feed = document.getElementById("lentaFeed");

        const labels = feed.getElementsByClassName("newshead");
        const data = feed.getElementsByClassName("news-content");

        var to_return = [];
        for(let i = 0; i < labels.length; i++){
            var _title = labels[i];
            var _img = data[i];

            _title = _title.getElementsByClassName("subtitle")[0].innerText;

            _img = _img.getElementsByTagName("img");
            if(_img.length !== 0 && typeof _img[0] !== 'undefined')
                _img = _img[0].src;
            else _img = "";

            if(_img !== "" && _title !== "")
            to_return.push({
                title: _title,
                img: _img
            });
        }
        
        return to_return;
    });    
    return result;
}

var VC_parse = async function (page){
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.waitForSelector(".feed__chunk:last-child");
    const _length = await page.evaluate(async () => {
        return await new Promise(resolve =>{
            const items = document.getElementsByClassName("feed__item");

            document.querySelector('.feed__chunk:last-child')
                .scrollIntoView({ block: 'end', inline: 'end' });  

            resolve(items.length);
        })
    });

    await page.waitForSelector(".content-image");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await page.evaluate((len) => {
        const items = document.getElementsByClassName("feed__item");
        var to_return = [];
        for (let i = 0; i < len; i++) {
            var e = items[i]; 

            e.scrollIntoView({ block: 'end', inline: 'end' });  

            var img = e.getElementsByTagName("img");

            
            if(img.length !== 0 && typeof img[0] !== 'undefined'){
                console.log(img[0].src);
                img = img[0].src;
            }else{ 
                img = e.getElementsByClassName("andropov_video__dummy");
                if(img.length !== 0 && typeof img[0] !== 'undefined'){
                    var reg = /url\(\"(.*)\"\)/gm;
                    if(reg.exec(img[0]) != null){
                        img = reg.exec(img[0].style.backgroundImage)[1];
                      }
                }
                else img = "";
            }
  
          var title = e.getElementsByClassName("content-title");
  
          if(title.length !== 0 && typeof title[0] !== 'undefined')
              title = title[0].innerText;
          else title = "";
  
          if(img !== "" && title !== "")
            to_return.push({ 
                title: title,
                img: img
            });
        };
        return to_return 
    }, _length);

    return result;
    
}

var NineGAG_parse = async function(page){
    await page.waitForSelector(".post-container");
    return await page.evaluate(() => {
        const posts = document.getElementsByTagName("article");

        var to_return = [];
        for(let i = 0; i < posts.length; i++){
            let _title = posts[i].getElementsByTagName("h1");
            let _img = posts[i].getElementsByClassName("post-container")[0].getElementsByTagName("img");

            if(_img.length === 0 || typeof _img[0] === 'undefined')
                _img = "";
            else _img = _img[0].src;

            if(_title.length === 0 || typeof _title[0] === 'undefined')
                _title = "";
            else _title = _title[0].innerText;
            
            if(_title !== "" && _img !== "")
                to_return.push({
                    title: _title,
                    img: _img
                });
        }

        return to_return;
    });
}

function write_down_image(url, text, font_file = 'test.fnt', caption_background = '#FFFFFF'){
    Jimp.read(url).then(image => {
        new Jimp(image.getWidth(), image.getWidth(), (err, caption) => {
            Jimp.loadFont(font_file).then(font => {
                caption.print(font, 10, 10, text, image.getWidth() - 20);
                caption.autocrop(0.0003);
                caption.contain(image.getWidth(), caption.getHeight(), Jimp.HORIZONTAL_ALIGN_LEFT);
                caption.scan(0, 0, caption.bitmap.width, caption.bitmap.height, function(x, y, idx) {
                    var r = this.bitmap.data[idx + 0];
                    var g = this.bitmap.data[idx + 1];
                    var b = this.bitmap.data[idx + 2];
                    var alpha = this.bitmap.data[idx + 3];
                    if(r === 0 && g === 0 && b === 0 && alpha === 0)
                        this.setPixelColor(Jimp.cssColorToHex(caption_background), x, y);
                });

                image.contain(image.getWidth(), image.getHeight() + caption.getHeight(), Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_BOTTOM);

                image.composite(caption, 0, 0, {
                    mode: Jimp.BLEND_MULTIPLY
                    });
                image.write('example_after.png');
            });
        }); 
        })
        .catch(err => {
            console.error(err);
        }
    );
}

const sites_table = function(name){
    switch (name){
        case 'yaplakal.com': return yaplakal_parse;
        case '9gag.com': return NineGAG_parse;
        case 'dtf.ru': return DTF_parse;
        case 'vc.ru': return VC_parse;
    }
    console.err('new site???');
    return;
}

var dump_posts = async function (site, subaddr = '/', config){
    const browser = await puppeteer.launch({
         headless: true, 
         ignoreHTTPSErrors: true, 
         //args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 10000 })
    await page.setDefaultNavigationTimeout(0);
    page.goto(`https://${site}${subaddr}`);
    await new Promise(resolve => setTimeout(resolve, config.timeout));
    

    const result = await sites_table(site)(page);
    await page._client.send("Page.stopLoading");

    await new Promise(resolve => setTimeout(resolve, 500));
    
    let pages = await browser.pages()
    await Promise.all(pages.map(page =>page.close()))
    await browser.close()

    return result;
}

const config_path = 'config.json';
const default_config = {
    timeout: 4000,
    default_url: "9gag.com",
    output_dir: "generated",
    background_color: '#000',
    caption:{
        use_jimp: false,
        css_font: "font-size: 20px;color: #fff;",
        font_path: 'test.fnt',
        margin:{
            top: 10,
            left: 10,
            right: 10,
            bottom: 10
        }
    }
};

var save_image = async function(browser, config, url, text){
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 })
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`${__dirname}/image_templ.html`);

    await page.evaluate(async(url, text, config) => {
            return await new Promise(resolve => {
                const img = document.getElementsByClassName("image-data")[0];
                img.onload = function(){
                    resolve(img.src)
                }
                img.src = url;
                document.getElementsByClassName("image-caption")[0].innerHTML = text;
                document.getElementsByClassName("image-caption")[0].style = `word-wrap: break-word;` + config.caption.css_font;

                document.body.style.backgroundColor = config.background_color;
                document.body.style.font = `14px -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,Helvetica,Geneva,sans-serif`;
                document.body.style.fontSmooth = `antialiased`;
        })
    }, url, text, config);
    const w = await page.evaluate(() => {
        const _w = document.getElementsByClassName("image-data")[0].naturalWidth;
        const data_block = document.getElementsByClassName("data")[0];
        data_block.style = `width:${_w}px; box-sizing: border-box;`;
        const { x, y, _, height } = data_block.getBoundingClientRect();
        return { left: x, top: y, width:_w, height };
    });

    const file_name = `/${config.output_dir}/image_${Math.floor(Math.random() * 10000)}.png`;

    async function screenshotDOMElement(rect, padding = 0) {
        return await page.screenshot({
            path: `${__dirname}` + file_name,
            clip: {
                x: rect.left - padding,
                y: rect.top - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            },
        });
    }
    await screenshotDOMElement(w, 5);

    return file_name;
}

function loadingAnimation(
    text = "",
    chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"],
    delay = 100
) {
    let x = 0;

    return setInterval(function() {
        process.stdout.write("\r" + chars[x++] + " " + text);
        x = x % chars.length;
    }, delay);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main(){
    if(!fs.existsSync(config_path)){
        const new_json = JSON.stringify(default_config, null, ' ');
        fs.writeFileSync(config_path, new_json, function(){});
    }

    const data = fs.readFileSync(config_path);
    var config = JSON.parse(data);

    rl.question(`url? `.green + `[default` + `:`.grey +`${config.default_url}` + `]` + ` : `.grey, (url) => {
        if(url === undefined || url === "")
            url = config.default_url;
        const reg = /(http:\/\/|https:\/\/|)(www\.|)(.*)\.(ru|com|org)(.*)/gm;
        const parsed = reg.exec(url);

        const site_name = parsed[3];
        const domen     = parsed[4];
        const subadress = parsed[5];    
        console.log(`Selected site`.green, `:`.grey,`${site_name}`.red);
               
        let dump_progress = loadingAnimation("Dumping...".green);
        dump_posts(`${site_name}.${domen}`, subadress, config).then(async ret => {
            readline.clearLine(process.stdout, 0)
            process.stdout.write("\r" + "✔" + " Dumped total ".green + ":".grey + ` ${ret.length}`);
            console.log('');
            clearInterval(dump_progress);
            //console.log(ret);
           
            let gen_progress = loadingAnimation("Generating picture... ".green);

            const browser = await puppeteer.launch({
                headless: true, 
                ignoreHTTPSErrors: true, 
                args: ['--no-sandbox'] 
            });
            
            for(let i = 0; i < ret.length; i++){
                const saved_image_name = await save_image(browser, config, ret[i].img, ret[i].title);
                readline.clearLine(process.stdout, 0)
                process.stdout.write("\r" + "✔");
                console.log(` [`+ `${i}`.green +`]`, `${ret[i].title}`.red, '=>', saved_image_name);
            }

            let pages = await browser.pages()
            await Promise.all(pages.map(page =>page.close()))
            await browser.close()

            clearInterval(gen_progress);
            readline.clearLine(process.stdout, 0)
            process.stdout.write("\r" + "✔" + " " + "All!".green);
            console.log('');
        });

        rl.close();
    });

    return 
}

main()