const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")

const baseUrl = "https://www.service-center-locator.com"

async function scrap() {
    const phone = []
    await rp(baseUrl)
        .then(async (htmlString) => {
            const $ = cheerio.load(htmlString)
            const cars = $(".content1homepage").children("div:first()")
            return new Promise((resolve) => {
                $(cars).find("span.zzo").each(async (i, sub) => {
                    phone[i] = {}
                    const subCategory = $(sub).children("strong")
                    phone[i]["subCategory"] = subCategory.text()
                    phone[i]['brands'] = []


                    // This code is used for push the data into the brands. This will work until the next span that is the sub Category

                    let text = $(subCategory).parent().next()
                    let count = 0
                    while (text.text() !== "") {
                        phone[i]['brands'][count] = {}
                        phone[i]['brands'][count]['brandName'] = text.text()
                        const subUrl = text.attr("href")
                        phone[i]['brands'][count]['subUrl'] = subUrl
                        const states = await secondPage(subUrl, text.text())
                        phone[i]['brands'][count]["states"] = states
                        text = $(text).next()
                        count++
                    }
                    // End of the logic subCategory
                    // This code is taking long time as usual
                    resolve()
                })
            })


        })
        .catch((err) => { })

    const brands = JSON.stringify(phone)
    fs.writeFileSync("./phones.json", brands)
}

scrap()


async function secondPage(subUrl, brand) {
    return new Promise((resolve) => {
        const arr = []
        rp(subUrl)
            .then((htmlString) => {
                const $ = cheerio.load(htmlString)
                $("#posts > div > div:nth-child(9),#posts > div > div:nth-child(10),#posts > div > div:nth-child(11),#posts > div > div:nth-child(12)").children("ul").each((i, state) => {
                    arr[i] = {}
                    arr[i]["stateName"] = $(state).children("strong").text()
                    arr[i]["cities"] = []
                    $(state).children("li").each(async (j, city) => {
                        arr[i]["cities"][j] = {}
                        arr[i]["cities"][j]["cityName"] = $(city).children("a").text()
                        const cityUrl = $(city).children("a").attr("href").replace("..", baseUrl)
                        arr[i]["cities"][j]["cityUrl"] = cityUrl
                        const b = await thirdPage(cityUrl, brand)
                        arr[i]["cities"][j]["address"] = b
                    })
                })
                resolve(arr)
            }).catch((err) => {

            })
    })
}




async function thirdPage(cityUrl, brand) {
    return new Promise((resolve) => {
        const arr = []
        rp(cityUrl)
            .then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")

                if (brand === "Firestone") {
                    $(postDiv).find(".elenchi").find(".nomenegozio").each((i, fireStone) => {
                        arr[i] = {}
                        const cityName = $(fireStone).text()
                        arr[i]["serviceCenterName"] = cityName
                        arr[i]["address1"] = $(fireStone).parent().text().replace(cityName, "").replaceAll("\t", "").replaceAll("\n", ",")
                    })

                }


                else {
                    $(postDiv).find(" div > div > h3:not(.fumna),div > div > div > strong,div > h3:not(.fumna), h4 ,td > strong,div > strong,p > span:not(.nomenegozio) > strong, div > div > div > h3,div > dl > dt, div > div > div > strong,tr > td:first() > h3").each((i, city) => {
                        arr[i] = {}
                        const cityName = $(city).text()
                        arr[i]["serviceCenterName"] = cityName


                        if (brand === "Freightliner") {
                            $(city).parent().parent().next().each((k, child) => {
                                $(child).each((l, address) => {
                                    arr[i][`address1`] = $(address).text().replaceAll("\t", "").replaceAll("\n", "  ,")
                                })
                            })

                        }
                        else if (brand === "Mazda") {
                            arr[i]["address1"] = $(city).parent().text().replace(cityName, "").replaceAll("\t", "").replaceAll("\n", "  ,")
                        }

                        // The code is used for getting the address of Audi,Chrysler, Fiat , Ford , Hyundai , Mercedes , Furuno, Garmin, Goodyear, Napa

                        else if ($(city).next().text()) {

                            const address1 = $(city).next()
                            const address2 = $(address1).next()
                            const address3 = $(address2).next()
                            const address4 = $(address3).next()

                            arr[i]["address1"] = address1.text().replaceAll("\t", "").replaceAll("\n", "  ,")

                            if (address2.text())

                                arr[i]["address2"] = address2.text().replaceAll("\t", "").replaceAll("\n", "  ,")

                            if (address3.text())

                                arr[i]["address3"] = address3.text().replaceAll("\t", "").replaceAll("\n", "  ,")

                            if (address4.text())

                                arr[i]["address4"] = address4.text().replaceAll("\t", "").replaceAll("\n", "  ,")

                        }

                        // The code is used for getting the address of Audi,Chrysler, Fiat , Ford , Hyundai , Mercedes , Furuno, Garmin, Goodyear, Napa 


                        // The code is used for getting the address of Bentley , BMW , Honda , Aamco, Jiffylube , Simrad , Tom Tom 

                        else if ($(city).parent().next().text()) {
                            const address1 = $(city).parent().next()
                            if (address1.text())
                                arr[i]["address1"] = address1.text().replaceAll("\t", "").replaceAll("\n", "  ,")
                            if ($(address1).next().text())
                                arr[i]["address2"] = $(address1).next().text().replaceAll("\t", "").replaceAll("\n", "  ,")
                        }

                        // The code is used for getting the address of Bentley , BMW , Honda , Aamco, Jiffylube , Simrad , Tom Tom 


                        else if ($(city).parent().text()) {
                            arr[i]["address1"] = $(city).parent().text().replace(city, "").replaceAll("\t", "").replaceAll("\n", "  ,")
                        }

                        else if ($(city).parent().parent().text()) {
                            arr[i]["address1"] = $(city).parent().parent().text().replace(city, "").replaceAll("\t", "").replaceAll("\n", "  ,")
                        }

                    })
                }
                resolve(arr)
            }).catch((err) => { })
    })
}