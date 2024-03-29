// "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit"
export const processCapitalOneActivities = rows => {
  return rows
    .reduce((acc, rowStr) => {
      const dataArr = rowStr.split(',')
      if (dataArr.length < 7) {
        return acc
      }
      // output columns: account, date, desc, category, amount
      return [
        ...acc,
        {
          date: dataArr[0],
          account: dataArr[2],
          desc: dataArr[3],
          category: dataArr[4],
          amount: dataArr[5] || `-${dataArr[6]}`,
        },
      ]
    }, [])
    .sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    })
}

// "Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"
export const processRBCActivities = rows => {
  return rows
    .reduce((acc, rowStr) => {
      const dataArr = rowStr.split(',')
      if (dataArr.length < 7) {
        return acc
      }
      // output columns: account, date, desc, category, amount
      return [
        ...acc,
        {
          account: `${dataArr[1]}-${dataArr[0]}`,
          date: dataArr[2],
          desc: `${dataArr[4]} ${dataArr[5]}`,
          category: '',
          amount: dataArr[6],
        },
      ]
    }, [])
    .sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    })
}

const download = (filename, text) => {
  var element = document.createElement('a')
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  )
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

export const downloadFinanceData = data => {
  const text = data.reduce((acc, { date, account, desc, category, amount }) => {
    return acc + `${date}, ${account}, ${desc}, ${category}, ${amount}\n`
  }, '')
  download('test.csv', text)
}
