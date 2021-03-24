import socket
import random
from datetime import datetime
from datetime import date
import random
import time
import json
import sys




def Produce():
    random.seed(datetime.now())
    num  = random.randint(0,29)
    symbol =["A","AA","AAB","AAC","AAN","BBTG","BBVA","BBW","BBX","BBY","CIM","CIO","CIR","CIT","DTT","DTZ",
    "DUA","DUC","DUK","DUKH","EE","EEA","EEP","EEQ","EFC","FRCC","FRCD","FRCE","FRM","FRO"]
    price =["$63.89","$67.09","$1245","$355.36","$369.56","$796.98","$11.23","$789.68","$253.68","$563.36"
            ,"$36.36","$89.68","$52.36","$12.36","$256.89","$123.68","$123.55","$145.36","$256.90","$1453.3"
            ,"$2586.36","$56.36","$125.36","$258.39","$1538.60","$3699.38","$125.39","$986.36","$56.39","26.36"]
    now = datetime.now()
    currenttime = str(now.strftime("%H:%M:%S"))
    Stock =  {"symbol": symbol[num],
                "price": price[num],
                "time":  currenttime
    }
    return Stock
def Main(listw= 0.5):  
    host = '167.99.224.154'  # The server's hostname or IP address
    port = 11000        # The port used by the server
  
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM) 
  
    # connect to server on local computer 
    s.connect((host,port)) 
  
    # message you send to server 
   
    stock = Produce() 
    while True:
        time.sleep(listw)
        data1= str.encode(json.dumps(stock))
        
        time.sleep(listw)
        # message sent to server
        s.sendall(data1) 
        # messaga received from server 
        data = s.recv(1024) 
        got = str(data)
        # print the received message 
        # here it would be a reverse of sent message 
        print('Received from the server :',str(data.decode('ascii'))) 
        # ask the client whether he wants to continue 
        if('room' in got):
            ans = input('\nproducer rejected try again (y/n) :') 
            if ans == 'y': 
                continue
            else: 
                break
        # close the connection 
        else:
            break
    s.close()
     
  
if __name__ == '__main__':
    timpqp = float(input("enter time quantum for  producer "))
    Main(timpqp) 
   
