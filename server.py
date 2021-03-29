
import time
import logging
import socket
import datetime
from datetime import date
from _thread import *
import threading
import random
import uuid 
from threading import * 
import ast
from collections import deque
import math
from queue import Queue
import random




print_lock = threading.Lock() 
dataqueue = Queue(maxsize = 8)
free = threading.Semaphore(4)
proreject =set()
prjectTime =[]
consreject =set()
crejectTime =[]
length = dataqueue.qsize()
diccounter =0
rejecteddic ={}
isf =True

def cnsumeactivity(consumed,id):
    now = datetime.datetime.now()
    today = date.today()
    current_time = str(now.strftime("%H:%M:%S"))
    # dd/mm/YY
    d1 = str(today.strftime("%d/%m/%Y"))
    timeconsumed = d1 + " " + current_time
    proucedid = consumed[0]
    stockconsumed = consumed[1]
    stocktolog = str(stockconsumed["symbol"]) + " "  + str(stockconsumed["price"]) + " "  + str(stockconsumed["time"])
    tolog = "Consumerid: "+id+" "+"stock Consumed: " + stocktolog+" " + "producerID : "+proucedid +" "+"TimeStamp: "+ timeconsumed
    logging.basicConfig(filename="activitylog.log", level=logging.INFO)
    logging.info(tolog)

def producelog(id,produced):
    tolog = "producerid: " +id +" "+ str(produced["symbol"]) + " "  + str(produced["price"]) + " "  + str(produced["time"])
    logging.basicConfig(filename="activitylog.log", level=logging.INFO)
    logging.info(tolog)

def notconsumed(id):
    tolog ="consumerid: "+id+" "+"no data to consume"
    logging.basicConfig(filename="activitylog.log", level=logging.INFO)
    logging.info(tolog)
def notroom(id,produced):
    tolog = "producerid: " +id +" "+"no produce"+" "+"stock Produced"+ " "+ str(produced["symbol"]) + " "  + str(produced["price"]) + " "  + str(produced["time"])
    logging.basicConfig(filename="activitylog.log", level=logging.INFO)
    logging.info(tolog)


def idgeneratorrandop():
    random.seed(datetime.datetime.now())
    num  = random.randint(0,45)
    id = 'Pid'+str(num)
    return id
def idgeneratorrandoc():
    random.seed(datetime.datetime.now())
    num  = random.randint(0,45)
    id = 'Cid'+str(num)
    return id
def idgeneratorrando2():
    lgid =  uuid.uuid4()
    id = str(lgid)[:8]
    return id

def produce(data,id):
    dict_str = data.decode("UTF-8")
    mydata = ast.literal_eval(dict_str)
    produced = (id,mydata)
    if(dataqueue.full() == False):
        dataqueue.put(produced)
        data = 'produced'
        producelog(id,mydata)
    else:
        data = 'no room'
        notroom(id,mydata)
        proreject.add(id)
        now = datetime.datetime.now()
        tid =(now,id)
        prjectTime.append(tid)
    byt=data.encode('utf-8')
    return byt


def consume(data,id):
    splitmess = (str(data)).split(',')
    splied1 = splitmess[1]
    splied1 = splied1.replace("'","")
    timeq = float(splied1)
    if(dataqueue.empty() == False):
        consumed =dataqueue.get()
        dataqueue.task_done()
        cnsumeactivity(consumed,id)
        time.sleep(timeq)
        data = 'consumed'
        
    else:
        data = 'no data to consume'
        notconsumed(id)
        consreject.add(id)
        now = datetime.datetime.now()
        tid = (now,id)
        crejectTime .append(tid)
   
    byt=data.encode('utf-8')
    return byt
    
def threaded(c,id,data,isfrom):
    byt =None
    global isf
    if(isfrom == True):
        if not data: 
            print('Bye') 
        # lock released on exit 
        if 'consume' in str(data):
            
            byt = consume(data,id)
        else:
            
            byt =produce(data,id)
        
        if('no' not in str(byt)):
            rejecteddic.pop(id)
            isf = False
    else:       
        if not data: 
            print('Bye') 
            # lock released on exit 
        if 'consume' in str(data):
            
            byt = consume(data,id)
        else:
            
            byt =produce(data,id)
            
        
    print(byt)
    """ free.release() """
    c.send(byt)
    
# connection closed 
    c.close()
      
    
def checktime():
    now = datetime.datetime.now()
    sub = datetime.timedelta(minutes=1, seconds =30)
    for tim in prjectTime:
        
        id = tim[1]
        newtime = now - tim[0]
        if(newtime > sub):
            proreject.discard(id)
        
    for tim in crejectTime:
        newtime = now - tim[0]
        id = tim[1]
        if(newtime > sub):
            consreject.discard(id)
def addtodic(id):
    global diccounter
    if(id in rejecteddic):
        rejecteddic[id]  +=1
    else:
        rejecteddic[id] = 1
    diccounter+=1
def runthrough5(c,id,data):
    if(rejecteddic[id] >=5):
        if('C' in id and dataqueue.empty() ==False):
            start_new_thread(threaded, (c,id,data,True,))
        elif('P' in id and dataqueue.full() == False):
            start_new_thread(threaded, (c,id,data,True,))



def Main(): 
# reverse a port on your computer 
    # in our case it is 12345 but it 
    # can be anything 
    host = '167.99.224.154'  # Standard loopback interface address (localhost)
    port = 11000        # Port to listen on (non-privileged ports are > 1023)
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM) 
    s.bind((host, port)) 
    print("socket binded to port", port) 
  
     # put the socket into listening mode 
    s.listen(5) 
    print("socket is listening") 
    
    # a forever loop until client wants to exit 
    while True: 
        # establish connection with client 
        c, addr = s.accept()
        s.setblocking(1)
        data = c.recv(20486)
        #Generate uniqueue id
        if(len(proreject) != 0 or len(consreject) !=0):
            checktime()
        if('consume'in str(data)):
            id= idgeneratorrandoc()
        else:
            id= idgeneratorrandop()
        print('Connected to :', addr[0], ':', addr[1]) 
       
        """ free.acquire() """
        if(30 in rejecteddic.values()):
            print_lock.acquire()
            if(id not in rejecteddic.keys()):
                byts ='cant consume or produce'
                byt=byts.encode('utf-8')
                c.send(byt)
                c.close()
            else:
                runthrough5(c,id,data)
            print_lock.release()
        else:
            
            if(id in proreject):
                
                if(dataqueue.full() == False):
                    proreject.discard(id)
                    start_new_thread(threaded, (c,id,data,False,))
                else:
                    proreject.add(id)
                    byts ='no room'
                    byt=byts.encode('utf-8')
                    addtodic(id)
                    c.send(byt)
                    # connection closed 
                    c.close()  

            elif(id in consreject):
                
                if(dataqueue.empty() == False):
                    consreject.discard(id)
                    start_new_thread(threaded, (c,id,data,False,))
                else:
                    consreject.add(id)
                    byts ='no data to consume'
                    byt=byts.encode('utf-8')
                    addtodic(id)
                    c.send(byt)
                    # connection closed 
                    c.close()  
            else:
                
                start_new_thread(threaded, (c,id,data,False,))
    s.close()

if __name__ == '__main__': 
    Main()
    
