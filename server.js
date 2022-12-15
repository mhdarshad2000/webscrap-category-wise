const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")

const baseUrl = "https://www.service-center-locator.com"

async function scrap() {
    const data = []
    await rp(baseUrl)
        .then(async (htmlString) => {
            const $ = cheerio.load(htmlString)
            const cars = $(".content1homepage").children("div:first()")
            return new Promise((resolve) => {
                $(cars).find("span.zzo").each(async (i, sub) => {
                    data[i] = {}
                    const subCategory = $(sub).children("strong")
                    data[i]["subCategory"] = subCategory.text()
                    data[i]['brands'] = []


                    // This code is used for push the data into the brands. This will work until the next span that is the sub Category

                    let text = $(subCategory).parent().next()
                    let count = 0
                    while (text.text() !== "") {
                        data[i]['brands'][count] = {}
                        data[i]['brands'][count]['brandName'] = text.text()
                        const subUrl = text.attr("href")
                        data[i]['brands'][count]['subUrl'] = subUrl

                        const states = await secondPage(subUrl)
                        data[i]['brands'][count]["states"] = states
                        text = $(text).next()
                        count++
                    }
                    // End of the logic subCategory
                    // This code is taking long time as usual
                    resolve()
                })
            })


        })

    const brands = JSON.stringify(data)
    fs.writeFileSync("./brands.json", brands)
}

scrap()


async function secondPage(subUrl) {
    return new Promise((resolve) => {
        const arr = []
        rp(subUrl)
            .then((htmlString) => {
                const $ = cheerio.load(htmlString)
                $("#posts > div > div:nth-child(9),#posts > div > div:nth-child(10),#posts > div > div:nth-child(11),#posts > div > div:nth-child(12),h4,").children("ul").each((i, state) => {
                    arr[i] = {}
                    arr[i]["stateName"] = $(state).children("strong").text()
                    arr[i]["cities"] = []
                    $(state).children("li").each(async (j, city) => {
                        arr[i]["cities"][j] = {}
                        arr[i]["cities"][j]["cityName"] = $(city).children("a").text()
                        const cityUrl = $(city).children("a").attr("href").replace("..", baseUrl)
                        arr[i]["cities"][j]["cityUrl"] = cityUrl
                        const b = await thirdPage(cityUrl)
                        arr[i]["cities"][j]["address"] = b
                    })
                })
                resolve(arr)
            }).catch((err) => {

            })
    })
}




async function thirdPage(cityUrl) {
    console.log(cityUrl)
    return new Promise((resolve) => {
        const arr = []
        rp(cityUrl)
            .then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div > div > h3:not(.fumna),div > div > div > strong,div > h3:not(.fumna), h4 ,td > strong,div > strong,p > span:not(.nomenegozio) > strong, div > div > div > h3,div > dl > dt, div > div > div > strong,tr > td:first() > h3").each((i, city) => {
                    arr[i] = {}
                    arr[i]["serviceCenterName"] = $(city).text()
                })
                resolve(arr)
            }).catch((err) => {console.log(1212)})
    })
}