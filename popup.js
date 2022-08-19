// Initialize butotn with users's prefered color
let changeColor = document.getElementById("changeColor");
let itemDiv = document.getElementById("items")

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

const item_names = ["SUBTOTAL", "TOTAL", "TIP"]
// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let url = tabs[0].url
    url = url.substring(32)
    let index = url.indexOf("/")
    let orderId = url.substring(0, index)
    chrome.cookies.getAll({
        domain: "doordash.com"
    }, function(cookies) {
        for (var i in cookies){
          if(cookies[i].name === "csrf_token"){
            const req = new XMLHttpRequest();
            const baseUrl = "https://www.doordash.com/graphql?operation=getConsumerOrdersWithDetails";
            req.withCredentials = true;
            req.open("POST", baseUrl, true);
            req.setRequestHeader("Content-type", "application/json");
            req.setRequestHeader("x-csrftoken",cookies[i].value)
            req.send("{\"operationName\":\"getConsumerOrderReceipt\",\"variables\":{\"orderCartId\":\""+orderId+"\"},\"query\":\"query getConsumerOrderReceipt($orderCartId: ID!) {\\n  getConsumerOrderReceipt(orderCartId: $orderCartId) {\\n    lineItems {\\n      ...lineItemFragment\\n      __typename\\n    }\\n    splitBillLineItems {\\n      consumerId\\n      lineItems {\\n        ...lineItemFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    commissionMessage\\n    storeName\\n    receiptOrders {\\n      ...ConvReceiptOrdersFragment\\n      __typename\\n    }\\n    orders {\\n      creator {\\n        id\\n        localizedNames {\\n          formalName\\n          informalName\\n          formalNameAbbreviated\\n          __typename\\n        }\\n        __typename\\n      }\\n      orderItemsList {\\n        id\\n        specialInstructions\\n        substitutionPreference\\n        quantity\\n        originalQuantity\\n        weightedActualQuantity\\n        item {\\n          id\\n          name\\n          price\\n          description\\n          priceMonetaryFields {\\n            unitAmount\\n            currency\\n            displayString\\n            decimalPlaces\\n            sign\\n            __typename\\n          }\\n          __typename\\n        }\\n        unitPriceMonetaryFields {\\n          currency\\n          unitAmount\\n          displayString\\n          __typename\\n        }\\n        optionsList {\\n          itemExtraOption {\\n            name\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      orderItemLineDetails {\\n        ...orderLineItemDetailsFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    doordashEntityInfo {\\n      entityName\\n      entityAddress\\n      entityVatId\\n      __typename\\n    }\\n    disclaimer\\n    liquorLicense {\\n      url\\n      label\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment ConvReceiptOrdersFragment on OrderReceipt {\\n  creatorId\\n  orderCartItemId\\n  removedList {\\n    ...ConvItemReceiptFragment\\n    __typename\\n  }\\n  itemsList {\\n    ...ConvItemReceiptFragment\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConvItemReceiptFragment on ItemReceipt {\\n  id\\n  specialInstructions\\n  substitutionPreference\\n  quantity\\n  originalQuantity\\n  weightedActualQuantity\\n  item {\\n    ...ConvItemReceiptDetailsFragment\\n    __typename\\n  }\\n  unitPriceMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  unitPriceWithOptionsMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  substitutedReceiptItem {\\n    quantity\\n    originalQuantity\\n    weightedActualQuantity\\n    item {\\n      ...ConvItemReceiptDetailsFragment\\n      __typename\\n    }\\n    unitPriceMonetaryFields {\\n      displayString\\n      __typename\\n    }\\n    unitPriceWithOptionsMonetaryFields {\\n      displayString\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment ConvItemReceiptDetailsFragment on ItemReceiptDetails {\\n  id\\n  name\\n  description\\n  price\\n  priceMonetaryFields {\\n    displayString\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment orderLineItemDetailsFragment on OrderItemLineDetailsReceipt {\\n  ...orderLineItemDetailsBaseFragment\\n  substituteItem {\\n    ...orderLineItemDetailsBaseFragment\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment orderLineItemDetailsBaseFragment on OrderItemLineDetailsReceipt {\\n  itemName\\n  subTotal {\\n    ...priceFragment\\n    __typename\\n  }\\n  specialInstructions\\n  substitutionPreference\\n  purchaseType\\n  isOutOfStock\\n  itemOptionDetailsList\\n  weightedSoldPriceInfo\\n  requestedQuantity {\\n    ...quantityInfoFragment\\n    __typename\\n  }\\n  fulfilledQuantity {\\n    ...quantityInfoFragment\\n    __typename\\n  }\\n  lineItemToolTipModal {\\n    title\\n    paragraphs {\\n      title\\n      description\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment priceFragment on AmountMonetaryFields {\\n  currency\\n  displayString\\n  unitAmount\\n  decimalPlaces\\n  sign\\n  __typename\\n}\\n\\nfragment quantityInfoFragment on Quantity {\\n  discreteQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  continuousQuantity {\\n    quantity\\n    unit\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment lineItemFragment on LineItem {\\n  label\\n  labelIcon\\n  discountIcon\\n  chargeId\\n  finalMoney {\\n    unitAmount\\n    displayString\\n    __typename\\n  }\\n  originalMoney {\\n    unitAmount\\n    displayString\\n    __typename\\n  }\\n  tooltip {\\n    title\\n    paragraphs {\\n      description\\n      __typename\\n    }\\n    __typename\\n  }\\n  note\\n  __typename\\n}\\n\"}")
            req.onreadystatechange = function(response) { // Call a function when the state changes.
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                  let orderInfo = JSON.parse(this.responseText).data.getConsumerOrderReceipt
                  let details = orderInfo.lineItems
                  let reducedDetails = {}
                  for(var i in details){
                    let name = details[i].chargeId
                    let amount =details[i].finalMoney.unitAmount
                    reducedDetails[name] = amount
                  }
                  let tipAmount = reducedDetails["TIP"]
                  let subtotal = reducedDetails["SUBTOTAL"]
                  let totalCharged = reducedDetails["TOTAL"]
                  let ratio = (totalCharged -tipAmount) /subtotal
                  let finalStr = ""
                  let orderItems = orderInfo.orders[0].orderItemsList
                  for(var i in orderItems){
                    let orderItem = orderItems[i]
                    let price = orderItem.unitPriceMonetaryFields.unitAmount/orderItem.quantity
                    finalStr += orderItem.item.name + "\t" + (price*ratio/100).toFixed(2) + "\t" +orderItem.item.description +"\n"
                    let div = document.createElement("div");
                    let span1 = document.createElement("span");
                    span1.textContent = orderItem.item.name
                    let span2 = document.createElement("span");
                    span2.textContent = (price*ratio/100).toFixed(2)
                    let span3 = document.createElement("span");
                    span3.textContent = orderItem.item.description
                    span3.id = "despSpan"
                    div.append(span1)
                    div.append(span2)
                    div.append(span3)
                    itemDiv.appendChild(div);
                  }
                  let div = document.createElement("div")
                  div.class="comment"
                  div.textContent="Select your ordered item and then plus $1 for the tip."
                  itemDiv.append(div)
                }
                
            }
          }
        }
    });
  });
  // chrome.tabs.executeScript({
  //   code: 'performance.getEntriesByType("resource").map(e => e.name)',
  // }, data => {
  //   alert("Got data")
  //   if (chrome.runtime.lastError || !data || !data[0]) return;
  //   const urls = data[0].map(url => url.split(/[#?]/)[0]);
  //   const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
  //   Promise.all(
  //     uniqueUrls.map(url =>
  //       new Promise(resolve => {

  //         alert("Inner promise", url)
  //         chrome.cookies.getAll({url}, resolve);
  //       })
  //     )
  //   ).then(results => {
  //     // convert the array of arrays into a deduplicated flat array of cookies
  //     const cookies = [
  //       ...new Map(
  //         [].concat(...results)
  //           .map(c => [JSON.stringify(c), c])
  //       ).values()
  //     ];
  
  //     // do something with the cookies here
  //     alert(JSON.stringify(uniqueUrls), JSON.stringify(cookies));
  //   });
  // });
});

// The body of this function will be execuetd as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}
