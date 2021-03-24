import socket
import random
from datetime import datetime
from datetime import date
import random
import time
import json

""" def randomnum ():
    random.seed(datetime.now())
    num  = random()
    return num """


def Main(timpqp=0.8): 
    host = '167.99.224.154'  # The server's hostname or IP address
    port = 11000        # The port used by the server
  
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM) 
  
    # connect to server on local computer 
    s.connect((host,port)) 
  
    # message you send to server 
   
     
    while True:
        
            # message sent to server 
        time.sleep(timpqp)
        tosend ='consume'+ ","+str(timpqp)
        s.send(tosend.encode('ascii')) 
        # messaga received from server 
        data = s.recv(1024) 
        
        # print the received message 
        # here it would be a reverse of sent message 
        print('Received from the server :',str(data.decode('ascii'))) 
        # ask the client whether he wants to continue 
        ans = input('\nDo you want to continue(y/n) :') 
        if ans == 'y': 
            continue
        else: 
            break
    # close the connection 
    s.close() 
  
if __name__ == '__main__': 
    timpqp =float( input("enter time quantum for  consumer "))
    Main(timpqp)  
